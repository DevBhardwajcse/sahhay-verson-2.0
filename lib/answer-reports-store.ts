export interface AnswerVerificationReport {
  id: string;
  questionSnippet: string;
  answerSnippet: string;
  issueCategory:
    | 'inaccurate_medical_info'
    | 'outdated_source'
    | 'missing_warning'
    | 'translation_error'
    | 'other';
  details: string;
  sourceCited: string;
  createdAt: string;
  reviewed: boolean;
}

const globalForAnswerReports = globalThis as unknown as {
  __sahaayAnswerReports?: AnswerVerificationReport[];
};

function ensureStore(): AnswerVerificationReport[] {
  if (!globalForAnswerReports.__sahaayAnswerReports) {
    globalForAnswerReports.__sahaayAnswerReports = [
      {
        id: 'ans-rep-seed-1',
        questionSnippet: 'Can I take ibuprofen for high fever when dengue is suspected?',
        answerSnippet: 'Avoid NSAIDs like ibuprofen or aspirin if dengue is suspected...',
        issueCategory: 'missing_warning',
        details: 'Confirmed accurate — sample audit entry demonstrating AI response quality review.',
        sourceCited: 'MoHFW India / NVBDCP STG-IN-2024.2',
        createdAt: new Date(Date.now() - 86_400_000).toISOString(),
        reviewed: true,
      },
    ];
  }
  return globalForAnswerReports.__sahaayAnswerReports;
}

export function listAnswerReports(): AnswerVerificationReport[] {
  return ensureStore();
}

export function addAnswerReport(
  input: Omit<AnswerVerificationReport, 'id' | 'createdAt' | 'reviewed'>
): AnswerVerificationReport {
  const store = ensureStore();
  const report: AnswerVerificationReport = {
    ...input,
    id: `ans-rep-${Date.now()}`,
    createdAt: new Date().toISOString(),
    reviewed: false,
  };
  store.unshift(report);
  if (store.length > 100) {
    store.length = 100;
  }
  return report;
}

export function markAnswerReportReviewed(id: string): AnswerVerificationReport | null {
  const store = ensureStore();
  const found = store.find((r) => r.id === id);
  if (!found) return null;
  found.reviewed = true;
  return found;
}
