export type InteractionSeverity = 'major' | 'moderate' | 'caution';

export interface CuratedInteractionRule {
  id: string;
  drugA: string[];
  drugB: string[];
  pairLabel: string;
  severity: InteractionSeverity;
  summaryEn: string;
  summaryHi: string;
  actionEn: string;
  actionHi: string;
  source: string;
  lastVerifiedDate: string;
}

export interface ActiveIngredientMapping {
  generic: string;
  aliases: string[];
}

export const ACTIVE_INGREDIENT_MAPPINGS: ActiveIngredientMapping[] = [
  {
    generic: 'paracetamol',
    aliases: ['paracetamol', 'acetaminophen', 'dolo', 'dolo 650', 'crocin', 'calpol', 'pacimol', 'metacin', 'combiflam', 'sumo', 'flexon', 'p-500', 'p-650'],
  },
  {
    generic: 'ibuprofen',
    aliases: ['ibuprofen', 'brufen', 'combiflam', 'flexon', 'ibugesic', 'advil', 'motrin'],
  },
  {
    generic: 'aspirin',
    aliases: ['aspirin', 'ecosprin', 'disprin', 'acetylsalicylic acid', 'asa'],
  },
  {
    generic: 'diclofenac',
    aliases: ['diclofenac', 'voveran', 'voltaren', 'dynapar', 'diclomol'],
  },
  {
    generic: 'naproxen',
    aliases: ['naproxen', 'naprosyn', 'aleve'],
  },
  {
    generic: 'warfarin',
    aliases: ['warfarin', 'warf', 'coumadin', 'acitrom', 'acenocoumarol'],
  },
  {
    generic: 'clopidogrel',
    aliases: ['clopidogrel', 'clopilet', 'plavix', 'deplatt', 'clopivas'],
  },
  {
    generic: 'omeprazole',
    aliases: ['omeprazole', 'omez', 'prilosec', 'esomeprazole', 'nexpro'],
  },
  {
    generic: 'metformin',
    aliases: ['metformin', 'glycomet', 'glucophage', 'cetapin', 'obimet'],
  },
  {
    generic: 'amlodipine',
    aliases: ['amlodipine', 'amlong', 'amlokind', 'stamlo', 'norvasc'],
  },
  {
    generic: 'simvastatin',
    aliases: ['simvastatin', 'zocor', 'simvotin'],
  },
  {
    generic: 'atorvastatin',
    aliases: ['atorvastatin', 'atorva', 'lipitor', 'tonact', 'storvas'],
  },
  {
    generic: 'ramipril',
    aliases: ['ramipril', 'cardace', 'enalapril', 'lisinopril', 'telmisartan', 'losartan'],
  },
  {
    generic: 'potassium',
    aliases: ['potassium', 'potklor', 'k-bind', 'spironolactone', 'aldactone'],
  },
  {
    generic: 'ciprofloxacin',
    aliases: ['ciprofloxacin', 'ciplox', 'cipro', 'levofloxacin', 'ofloxacin'],
  },
  {
    generic: 'antacid_calcium',
    aliases: ['calcium', 'shelcal', 'cipcal', 'antacid', 'gelusil', 'digene', 'iron', 'ferrous', 'sucralfate'],
  },
  {
    generic: 'azithromycin',
    aliases: ['azithromycin', 'azee', 'azithral', 'zithromax'],
  },
  {
    generic: 'amiodarone',
    aliases: ['amiodarone', 'cordarone', 'ondansetron', 'emeset', 'fluconazole', 'haloperidol'],
  },
  {
    generic: 'sildenafil',
    aliases: ['sildenafil', 'viagra', 'manforce', 'tadalafil'],
  },
  {
    generic: 'nitrates',
    aliases: ['nitroglycerin', 'sorbitrate', 'isosorbide', 'monotrate', 'angispan', 'nitrate'],
  },
  {
    generic: 'methotrexate',
    aliases: ['methotrexate', 'folitrax', 'mtx'],
  },
  {
    generic: 'amoxicillin',
    aliases: ['amoxicillin', 'mox', 'augmentin', 'amoxyclav', 'novamox'],
  },
  {
    generic: 'lithium',
    aliases: ['lithium', 'licab', 'lithosun'],
  },
  {
    generic: 'alcohol',
    aliases: ['alcohol', 'ethanol', 'wine', 'beer', 'whisky'],
  },
];

export const CURATED_DRUG_INTERACTIONS: CuratedInteractionRule[] = [
  {
    id: 'warfarin-nsaids-aspirin',
    drugA: ['warfarin'],
    drugB: ['aspirin', 'ibuprofen', 'diclofenac', 'naproxen'],
    pairLabel: 'Blood Thinner (Warfarin/Acenocoumarol) + NSAID / Aspirin',
    severity: 'major',
    summaryEn:
      'Combining anticoagulants with aspirin or NSAID pain relievers substantially increases the risk of serious gastrointestinal or internal bleeding.',
    summaryHi:
      'खून पतला करने वाली दवा (Warfarin) के साथ एस्पिरिन या दर्द निवारक NSAID (जैसे Ibuprofen/Diclofenac) लेने से गंभीर आंतरिक या पेट के रक्तस्राव का खतरा काफी बढ़ जाता है।',
    actionEn:
      'Do not combine without explicit supervision from your prescribing doctor. Seek urgent care if you notice black stools, bruising, or unusual bleeding.',
    actionHi:
      'डॉक्टर की स्पष्ट सलाह के बिना इन्हें साथ न लें। काला मल, असामान्य नील पड़ना या रक्तस्राव दिखने पर तुरंत डॉक्टर से मिलें।',
    source: 'WHO Essential Medicines & U.S. FDA Drug Safety Labeling',
    lastVerifiedDate: '2026-03-01',
  },
  {
    id: 'nitrates-sildenafil',
    drugA: ['nitrates'],
    drugB: ['sildenafil'],
    pairLabel: 'Nitrates (Nitroglycerin / Isosorbide) + Sildenafil / Tadalafil',
    severity: 'major',
    summaryEn:
      'Taking nitrates together with PDE5 inhibitors (sildenafil/tadalafil) can trigger a dangerous, sudden drop in blood pressure.',
    summaryHi:
      'नाइट्रेट दवाओं (जैसे Sorbitrate/Nitroglycerin) के साथ Sildenafil या Tadalafil लेने से रक्तचाप खतरनाक रूप से अचानक गिर सकता है।',
    actionEn:
      'Strictly avoid combining and consult a cardiologist or prescribing doctor immediately before using either together.',
    actionHi:
      'इन्हें साथ लेने से बचें और तुरंत अपने हृदय रोग विशेषज्ञ या डॉक्टर से सलाह लें।',
    source: 'U.S. FDA Boxed Warning & ICMR Cardiovascular Guidance',
    lastVerifiedDate: '2026-03-01',
  },
  {
    id: 'clopidogrel-omeprazole',
    drugA: ['clopidogrel'],
    drugB: ['omeprazole'],
    pairLabel: 'Clopidogrel + Omeprazole / Esomeprazole',
    severity: 'major',
    summaryEn:
      'Omeprazole and esomeprazole can inhibit the CYP2C19 enzyme needed to activate clopidogrel, potentially reducing its antiplatelet protection.',
    summaryHi:
      'Omeprazole या Esomeprazole, Clopidogrel के असर को कम कर सकते हैं जिससे हृदय सुरक्षा प्रभावित हो सकती है।',
    actionEn:
      'Ask your prescribing doctor or pharmacist whether a different stomach-protection medicine is preferred. Do not stop clopidogrel on your own.',
    actionHi:
      'अपनी मर्जी से Clopidogrel बंद न करें; डॉक्टर या फार्मासिस्ट से पेट की सुरक्षित वैकल्पिक दवा के बारे में पूछें।',
    source: 'U.S. FDA Drug Safety Communication & NLEM India',
    lastVerifiedDate: '2026-03-01',
  },
  {
    id: 'ibuprofen-aspirin',
    drugA: ['aspirin'],
    drugB: ['ibuprofen', 'diclofenac', 'naproxen'],
    pairLabel: 'Aspirin + NSAID Pain Reliever (Ibuprofen / Diclofenac / Naproxen)',
    severity: 'moderate',
    summaryEn:
      'Taking two NSAIDs together increases stomach ulcer/bleeding risk, and ibuprofen may interfere with low-dose aspirin heart protection.',
    summaryHi:
      'एस्पिरिन के साथ अन्य NSAID दर्द निवारक लेने से पेट में अल्सर/रक्तस्राव का खतरा बढ़ता है और लो-डोज़ एस्पिरिन का असर कम हो सकता है।',
    actionEn:
      'Review pain-relief options and timing with your doctor or pharmacist before combining.',
    actionHi:
      'इन्हें साथ लेने से पहले डॉक्टर या फार्मासिस्ट से सुरक्षित विकल्प और समय के बारे में पूछें।',
    source: 'U.S. FDA & NIH MedlinePlus Drug Information',
    lastVerifiedDate: '2026-03-01',
  },
  {
    id: 'ace-arb-nsaids',
    drugA: ['ramipril'],
    drugB: ['ibuprofen', 'diclofenac', 'naproxen'],
    pairLabel: 'Blood Pressure Medicine (ACE Inhibitor / ARB) + NSAID',
    severity: 'moderate',
    summaryEn:
      'Regular NSAID use alongside ACE inhibitors or ARBs can reduce blood-pressure control and add strain on the kidneys, especially during dehydration.',
    summaryHi:
      'रक्तचाप की दवाओं (जैसे Ramipril/Telmisartan/Losartan) के साथ नियमित NSAID लेने से बीपी नियंत्रण कम हो सकता है और गुर्दे पर दबाव बढ़ सकता है।',
    actionEn:
      'Consult your physician or pharmacist before taking pain relievers regularly with blood pressure medicines.',
    actionHi:
      'बीपी की दवा के साथ नियमित दर्द निवारक लेने से पहले डॉक्टर या फार्मासिस्ट की सलाह लें।',
    source: 'WHO Primary Care & Clinical Pharmacology Reference',
    lastVerifiedDate: '2026-03-01',
  },
  {
    id: 'ace-arb-potassium',
    drugA: ['ramipril'],
    drugB: ['potassium'],
    pairLabel: 'ACE Inhibitor / ARB + Potassium Supplement / Spironolactone',
    severity: 'major',
    summaryEn:
      'Combining these can raise blood potassium levels (hyperkalemia), which may affect heart rhythm if unmonitored.',
    summaryHi:
      'इन दवाओं को साथ लेने से रक्त में पोटेशियम का स्तर बढ़ सकता है, जो निगरानी के बिना हृदय गति को प्रभावित कर सकता है।',
    actionEn:
      'Discuss with your doctor and ensure periodic lab monitoring if both are prescribed.',
    actionHi:
      'यदि दोनों दवाएं लिखी गई हैं तो डॉक्टर से सलाह लें और नियमित रक्त जांच कराएं।',
    source: 'WHO Essential Medicines & U.S. FDA Labeling',
    lastVerifiedDate: '2026-03-01',
  },
  {
    id: 'cipro-antacids-calcium',
    drugA: ['ciprofloxacin'],
    drugB: ['antacid_calcium'],
    pairLabel: 'Fluoroquinolone Antibiotic (Ciprofloxacin) + Calcium / Iron / Antacids',
    severity: 'moderate',
    summaryEn:
      'Calcium, iron, and mineral antacids bind to ciprofloxacin in the stomach and can significantly reduce antibiotic absorption.',
    summaryHi:
      'कैल्शियम, आयरन या एंटासिड के साथ Ciprofloxacin लेने से एंटीबायोटिक का अवशोषण कम हो सकता है।',
    actionEn:
      'Ask your pharmacist about proper spacing between doses; do not stop prescribed antibiotics prematurely.',
    actionHi:
      'दवाओं के बीच सही समय अंतराल के लिए फार्मासिस्ट से पूछें और निर्धारित एंटीबायोटिक अधूरा न छोड़ें।',
    source: 'WHO Antibiotic Stewardship & OpenFDA Labeling',
    lastVerifiedDate: '2026-03-01',
  },
  {
    id: 'amlodipine-simvastatin',
    drugA: ['amlodipine'],
    drugB: ['simvastatin'],
    pairLabel: 'Amlodipine + Simvastatin',
    severity: 'moderate',
    summaryEn:
      'Amlodipine increases simvastatin blood levels, raising the risk of muscle pain or muscle injury at higher simvastatin doses.',
    summaryHi:
      'Amlodipine के साथ अधिक मात्रा में Simvastatin लेने से मांसपेशियों में दर्द या क्षति का खतरा बढ़ सकता है।',
    actionEn:
      'Have your prescribing doctor or pharmacist verify your statin dose and report unexplained muscle pain.',
    actionHi:
      'अपने डॉक्टर या फार्मासिस्ट से दवा की मात्रा की समीक्षा कराएं और असामान्य मांसपेशी दर्द होने पर सूचित करें।',
    source: 'U.S. FDA Drug Safety Labeling',
    lastVerifiedDate: '2026-03-01',
  },
  {
    id: 'azithromycin-qt',
    drugA: ['azithromycin'],
    drugB: ['amiodarone'],
    pairLabel: 'Azithromycin + QT-Prolonging Medication',
    severity: 'major',
    summaryEn:
      'Both medicines can prolong the heart QT interval, increasing the risk of irregular heart rhythm in susceptible patients.',
    summaryHi:
      'इन दोनों दवाओं को साथ लेने से हृदय की लय (QT interval) प्रभावित होने का खतरा बढ़ सकता है।',
    actionEn:
      'Confirm suitability with your doctor or pharmacist before taking together.',
    actionHi:
      'साथ लेने से पहले अपने डॉक्टर या फार्मासिस्ट से पुष्टि करें।',
    source: 'U.S. FDA & Clinical Cardiology Safety Reference',
    lastVerifiedDate: '2026-03-01',
  },
  {
    id: 'methotrexate-nsaids-amox',
    drugA: ['methotrexate'],
    drugB: ['ibuprofen', 'diclofenac', 'naproxen', 'aspirin', 'amoxicillin'],
    pairLabel: 'Methotrexate + NSAID / Aspirin / Amoxicillin',
    severity: 'major',
    summaryEn:
      'NSAIDs and certain penicillins can slow methotrexate clearance from the kidneys, increasing the risk of methotrexate toxicity.',
    summaryHi:
      'NSAID दर्द निवारक या Amoxicillin गुर्दे से Methotrexate के बाहर निकलने की गति धीमी कर सकते हैं, जिससे विषाक्तता का खतरा बढ़ता है।',
    actionEn:
      'Always verify with your rheumatologist, oncologist, or pharmacist before combining.',
    actionHi:
      'इन्हें साथ लेने से पहले हमेशा अपने विशेषज्ञ डॉक्टर या फार्मासिस्ट से सलाह लें।',
    source: 'WHO Essential Medicines & OpenFDA Labeling',
    lastVerifiedDate: '2026-03-01',
  },
  {
    id: 'lithium-nsaids',
    drugA: ['lithium'],
    drugB: ['ibuprofen', 'diclofenac', 'naproxen'],
    pairLabel: 'Lithium + NSAID Pain Reliever',
    severity: 'major',
    summaryEn:
      'NSAIDs can reduce lithium excretion through the kidneys and increase blood lithium concentrations to potentially toxic levels.',
    summaryHi:
      'NSAID दर्द निवारक रक्त में Lithium का स्तर बढ़ा सकते हैं जिससे विषाक्तता का खतरा हो सकता है।',
    actionEn:
      'Consult your psychiatrist or physician before taking any over-the-counter NSAID pain reliever.',
    actionHi:
      'कोई भी दर्द निवारक लेने से पहले अपने डॉक्टर या मनोचिकित्सक से अवश्य सलाह लें।',
    source: 'U.S. FDA Drug Labeling',
    lastVerifiedDate: '2026-03-01',
  },
  {
    id: 'metformin-alcohol',
    drugA: ['metformin'],
    drugB: ['alcohol'],
    pairLabel: 'Metformin + Alcohol',
    severity: 'moderate',
    summaryEn:
      'Excessive alcohol intake with metformin increases the risk of lactic acidosis and unpredictable blood sugar drops.',
    summaryHi:
      'Metformin के साथ अधिक शराब का सेवन लैक्टिक एसिडोसिस और ब्लड शुगर में अचानक गिरावट का खतरा बढ़ाता है।',
    actionEn:
      'Discuss safe limits and diabetes medication precautions with your doctor.',
    actionHi:
      'अपने डॉक्टर से मधुमेह की दवा के साथ सुरक्षित सावधानियों के बारे में चर्चा करें।',
    source: 'ICMR Diabetes Guidelines & OpenFDA',
    lastVerifiedDate: '2026-03-01',
  },
];

export interface DuplicateIngredientWarning {
  generic: string;
  matchedInputs: string[];
  warningEn: string;
  warningHi: string;
}

export interface MedicineSafetyCheckResult {
  normalizedInputs: Array<{ input: string; matchedGenerics: string[] }>;
  flaggedInteractions: Array<
    CuratedInteractionRule & {
      matchedPair: [string, string];
    }
  >;
  duplicateIngredients: DuplicateIngredientWarning[];
  neverSafeGuaranteeNoticeEn: string;
  neverSafeGuaranteeNoticeHi: string;
}

export function normalizeMedicineName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractActiveIngredients(raw: string): string[] {
  const norm = normalizeMedicineName(raw);
  if (!norm) return [];

  const found = new Set<string>();
  for (const mapping of ACTIVE_INGREDIENT_MAPPINGS) {
    for (const alias of mapping.aliases) {
      if (norm === alias || norm.includes(alias) || (alias.length >= 4 && alias.includes(norm) && norm.length >= 4)) {
        found.add(mapping.generic);
        break;
      }
    }
  }
  return Array.from(found);
}

/**
 * Deterministic safety checker for medicine lists.
 * Flags curated major/moderate interactions and duplicate active ingredients (e.g., Dolo 650 + Combiflam both containing Paracetamol).
 * NEVER declares any combination guaranteed safe.
 */
export function checkMedicineSafety(medicines: string[]): MedicineSafetyCheckResult {
  const cleaned = medicines.map((m) => m.trim()).filter((m) => m.length >= 2);
  const normalizedInputs = cleaned.map((input) => ({
    input,
    matchedGenerics: extractActiveIngredients(input),
  }));

  // 1. Detect duplicate active ingredients across different listed products
  const genericToInputs = new Map<string, string[]>();
  for (const item of normalizedInputs) {
    for (const gen of item.matchedGenerics) {
      const existing = genericToInputs.get(gen) ?? [];
      if (!existing.includes(item.input)) {
        existing.push(item.input);
      }
      genericToInputs.set(gen, existing);
    }
  }

  const duplicateIngredients: DuplicateIngredientWarning[] = [];
  for (const [generic, inputs] of genericToInputs.entries()) {
    if (inputs.length >= 2) {
      duplicateIngredients.push({
        generic,
        matchedInputs: inputs,
        warningEn: `Possible duplicate active ingredient (${generic}) detected across: ${inputs.join(' + ')}. Combining products with the same active ingredient risks accidental overdose — confirm with a pharmacist or doctor.`,
        warningHi: `एक ही सक्रिय तत्व (${generic}) एक से अधिक दवाओं (${inputs.join(' + ')}) में मौजूद हो सकता है। ओवरडोज़ के जोखिम से बचने के लिए फार्मासिस्ट या डॉक्टर से पुष्टि करें।`,
      });
    }
  }

  // 2. Check all unordered pairs against curated interaction rules
  const flaggedInteractions: Array<CuratedInteractionRule & { matchedPair: [string, string] }> = [];
  const seenRuleIds = new Set<string>();

  for (let i = 0; i < normalizedInputs.length; i++) {
    for (let j = i + 1; j < normalizedInputs.length; j++) {
      const itemA = normalizedInputs[i];
      const itemB = normalizedInputs[j];
      for (const rule of CURATED_DRUG_INTERACTIONS) {
        if (seenRuleIds.has(rule.id)) continue;
        const aMatchesFirst = itemA.matchedGenerics.some((g) => rule.drugA.includes(g));
        const bMatchesSecond = itemB.matchedGenerics.some((g) => rule.drugB.includes(g));
        const aMatchesSecond = itemA.matchedGenerics.some((g) => rule.drugB.includes(g));
        const bMatchesFirst = itemB.matchedGenerics.some((g) => rule.drugA.includes(g));

        if ((aMatchesFirst && bMatchesSecond) || (aMatchesSecond && bMatchesFirst)) {
          seenRuleIds.add(rule.id);
          flaggedInteractions.push({
            ...rule,
            matchedPair: [itemA.input, itemB.input],
          });
        }
      }
    }
  }

  // Sort major before moderate before caution
  const rank: Record<InteractionSeverity, number> = { major: 0, moderate: 1, caution: 2 };
  flaggedInteractions.sort((a, b) => rank[a.severity] - rank[b.severity]);

  return {
    normalizedInputs,
    flaggedInteractions,
    duplicateIngredients,
    neverSafeGuaranteeNoticeEn:
      'Important: Even if no interaction is flagged here, this tool does NOT guarantee a combination is safe for you. Individual allergies, kidney/liver function, age, pregnancy, and unlisted herbs or supplements require review by a qualified doctor or pharmacist.',
    neverSafeGuaranteeNoticeHi:
      'महत्वपूर्ण: यहाँ कोई इंटरैक्शन न दिखने का अर्थ यह नहीं है कि दवाओं का संयोजन आपके लिए पूरी तरह सुरक्षित है। हमेशा योग्य डॉक्टर या फार्मासिस्ट से अपनी पूरी दवा सूची की जांच कराएं।',
  };
}
