import { GoogleGenAI } from '@google/genai';
import { ESSENTIAL_MEDICINES_REFERENCE, ClinicalMedicineReference } from './helplines-data';
import { searchClinicalKnowledgeBase } from './clinical-knowledge-base';

/**
 * Centralized server-side Gemini model configuration.
 * All Gemini API calls run exclusively on the server using process.env.GEMINI_API_KEY.
 */
export const GEMINI_MODELS = {
  chat: 'gemini-4-hydrogen',
  multimodalVision: 'gemini-4-hydrogen',
  grounding: 'gemini-4-hydrogen',
  fastLite: 'gemini-3.1-flash-lite',
  transcribe: 'gemini-3.5-transcribe',
  ttsStandard: 'gemini-3.8-flash-lite-tts',
  ttsExpressive: 'gemini-3.8-flash-tts',
} as const;

let cachedAiClient: GoogleGenAI | null = null;

export function getGeminiServerClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_NOT_CONFIGURED');
  }
  if (!cachedAiClient) {
    cachedAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedAiClient;
}

export interface ClinicalReferenceResult {
  source: string;
  verified: boolean;
  title: string;
  documentTitle?: string;
  category?: string;
  commonUses: string;
  precautions: string;
  url?: string;
  publicationDate?: string;
  version?: string;
  reviewStatus?: string;
  lastVerifiedDate?: string;
}

/**
 * Queries reputable public clinician-reviewed medical reference sources:
 * 1. Curated MoHFW India / WHO / ICMR / NLEM clinical knowledge base with full provenance metadata
 * 2. Curated Essential Medicines India reference table
 * 3. Live U.S. FDA Drug Labeling API (OpenFDA) for medicines
 * 4. Live U.S. National Library of Medicine MedlinePlus Web Service for general medical topics
 */
export async function lookupClinicalReference(
  query: string,
  kind: 'medicine' | 'topic' = 'medicine'
): Promise<ClinicalReferenceResult[]> {
  const cleaned = query.trim();
  if (!cleaned) return [];

  const results: ClinicalReferenceResult[] = [];
  const lower = cleaned.toLowerCase();

  // 1. Curated clinical knowledge base (RAG retrieval with full provenance metadata)
  const kbMatches = searchClinicalKnowledgeBase(cleaned, kind === 'topic' ? 3 : 1);
  for (const { entry } of kbMatches) {
    results.push({
      source: entry.sourceName,
      verified: true,
      title: entry.subject,
      documentTitle: entry.documentTitle,
      category: entry.recommendedSpecialtyLabelEn,
      commonUses: entry.summaryEn,
      precautions: entry.precautionsEn,
      url: entry.sourceUrl,
      publicationDate: entry.publicationDate,
      version: entry.version,
      reviewStatus: entry.reviewStatus,
      lastVerifiedDate: entry.lastVerifiedDate,
    });
  }

  // 2. Local curated WHO / NLEM India essential medicines table
  const localMatches: ClinicalMedicineReference[] = ESSENTIAL_MEDICINES_REFERENCE.filter(
    (med) =>
      med.genericName.toLowerCase().includes(lower) ||
      lower.includes(med.genericName.split(' ')[0].toLowerCase()) ||
      med.commonBrandsIndia.some((b) => lower.includes(b.toLowerCase()) || b.toLowerCase().includes(lower))
  );

  for (const med of localMatches.slice(0, 2)) {
    results.push({
      source: med.source,
      verified: true,
      title: `${med.genericName} (Common India brands: ${med.commonBrandsIndia.join(', ')})`,
      documentTitle: `WHO Model List / NLEM India — ${med.genericName}`,
      category: med.category,
      commonUses: med.commonUsesEn,
      precautions: med.generalPrecautionsEn,
      publicationDate: '2024-01-01',
      version: 'NLEM-2022/WHO-23',
      reviewStatus: 'Clinician-Reviewed Reference',
      lastVerifiedDate: '2026-03-01',
    });
  }

  // 2. Live OpenFDA Drug Labeling API (public clinical reference, no API key needed)
  if (kind === 'medicine') {
    try {
      const safeTerm = cleaned.replace(/[^a-zA-Z0-9\s-]/g, '').trim().split(/\s+/).slice(0, 3).join('+');
      if (safeTerm.length >= 3) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3500);
        const fdaUrl = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(safeTerm)}"+openfda.brand_name:"${encodeURIComponent(safeTerm)}"&limit=2`;
        const fdaRes = await fetch(fdaUrl, { signal: controller.signal });
        clearTimeout(timer);
        if (fdaRes.ok) {
          const data = (await fdaRes.json()) as {
            results?: Array<{
              openfda?: {
                brand_name?: string[];
                generic_name?: string[];
                pharm_class_epc?: string[];
                manufacturer_name?: string[];
              };
              indications_and_usage?: string[];
              purpose?: string[];
              warnings?: string[];
              warnings_and_cautions?: string[];
              do_not_use?: string[];
            }>;
          };
          for (const item of data.results ?? []) {
            const brand = item.openfda?.brand_name?.[0];
            const generic = item.openfda?.generic_name?.[0];
            const title = [generic, brand].filter(Boolean).join(' / ') || cleaned;
            const uses = (item.indications_and_usage?.[0] || item.purpose?.[0] || '').slice(0, 480);
            const warn = (
              item.warnings?.[0] ||
              item.warnings_and_cautions?.[0] ||
              item.do_not_use?.[0] ||
              ''
            ).slice(0, 480);
            if (uses || warn) {
              results.push({
                source: 'U.S. FDA Drug Labeling Database (OpenFDA)',
                verified: true,
                title,
                category: item.openfda?.pharm_class_epc?.[0],
                commonUses: uses || 'Refer to official prescribing information or pharmacist.',
                precautions: warn || 'Consult a qualified doctor or pharmacist for contraindications and warnings.',
                url: 'https://open.fda.gov/apis/drug/label/',
              });
            }
          }
        }
      }
    } catch {
      // Non-fatal: continue gracefully with other references
    }
  }

  // 3. Live U.S. NLM MedlinePlus Health Topics API (official NIH/NLM public XML API)
  try {
    const safeTopic = cleaned.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    if (safeTopic.length >= 3) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const nlmUrl = `https://wsearch.nlm.nih.gov/ws/query?db=healthTopics&term=${encodeURIComponent(safeTopic)}&retmax=2`;
      const nlmRes = await fetch(nlmUrl, { signal: controller.signal });
      clearTimeout(timer);
      if (nlmRes.ok) {
        const xml = await nlmRes.text();
        const docBlocks = xml.match(/<document[\s\S]*?<\/document>/g) ?? [];
        for (const block of docBlocks.slice(0, 2)) {
          const urlMatch = block.match(/url="([^"]+)"/);
          const titleMatch = block.match(/<content name="title">([\s\S]*?)<\/content>/);
          const summaryMatch = block.match(/<content name="FullSummary">([\s\S]*?)<\/content>/);
          const stripHtml = (s: string) =>
            s
              .replace(/&lt;[^&]*?&gt;/g, ' ')
              .replace(/<[^>]+>/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/\s+/g, ' ')
              .trim();
          const title = titleMatch ? stripHtml(titleMatch[1]) : '';
          const summary = summaryMatch ? stripHtml(summaryMatch[1]).slice(0, 480) : '';
          if (title && summary) {
            results.push({
              source: 'NIH / U.S. National Library of Medicine (MedlinePlus)',
              verified: true,
              title,
              commonUses: summary,
              precautions: 'Educational health reference only. Confirm diagnosis and care plan with a qualified physician.',
              url: urlMatch ? urlMatch[1] : 'https://medlineplus.gov/',
            });
          }
        }
      }
    }
  } catch {
    // Non-fatal: continue gracefully
  }

  return results.slice(0, 5);
}

/**
 * Formats friendly, sanitized error messages without leaking raw keys or stack traces.
 */
export function formatSafeGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('GEMINI_API_NOT_CONFIGURED')) {
    return {
      status: 503,
      message:
        'SAHAAY AI service is not configured yet. Please configure GEMINI_API_KEY in Settings > Secrets. Offline triage and verified 112 helplines remain available.',
    };
  }
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message:
        'AI request quota has been reached temporarily. Please wait a moment and try again, or use offline guided triage and 112 emergency helplines.',
    };
  }
  if (raw.includes('403') || raw.includes('PERMISSION_DENIED') || raw.includes('API_KEY_INVALID')) {
    return {
      status: 503,
      message:
        'AI service authentication could not be verified. Please check your API key configuration in Settings > Secrets.',
    };
  }
  return {
    status: 502,
    message:
      'Unable to reach SAHAAY AI right now. Please retry shortly or use offline guided triage and verified emergency contacts.',
  };
}
