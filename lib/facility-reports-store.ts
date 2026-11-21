export interface FacilityInfoReport {
  id: string;
  placeId: string;
  facilityName: string;
  facilityAddress: string;
  issueType: 'closed' | 'wrong_phone' | 'wrong_address' | 'wrong_hours' | 'wrong_specialty' | 'other';
  details: string;
  status: 'open' | 'reviewed';
  createdAt: string;
}

const globalForReports = globalThis as unknown as {
  __sahaayFacilityReports?: FacilityInfoReport[];
};

function getReportsArray(): FacilityInfoReport[] {
  if (!globalForReports.__sahaayFacilityReports) {
    globalForReports.__sahaayFacilityReports = [];
  }
  return globalForReports.__sahaayFacilityReports;
}

export function addFacilityReport(
  report: Omit<FacilityInfoReport, 'id' | 'status' | 'createdAt'>
): FacilityInfoReport {
  const entry: FacilityInfoReport = {
    ...report,
    id: `frep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    status: 'open',
    createdAt: new Date().toISOString(),
  };
  const arr = getReportsArray();
  arr.unshift(entry);
  if (arr.length > 100) {
    arr.length = 100;
  }
  return entry;
}

export function listFacilityReports(): FacilityInfoReport[] {
  return [...getReportsArray()];
}

export function markFacilityReportReviewed(id: string): FacilityInfoReport | null {
  const arr = getReportsArray();
  const target = arr.find((r) => r.id === id);
  if (!target) return null;
  target.status = 'reviewed';
  return target;
}
