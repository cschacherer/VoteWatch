export const endpointsAPI = {
    bills: "/bills",
    billDetails: (sessionId: string, billId: string) =>
        `bills/${sessionId}/${billId}`,
    billVotes: (sessionId: string, billId: string) =>
        `bills/${sessionId}/${billId}/votes`,
    legislators: "/legislators",
    legislatorDetails: (legislatorId: string) => `legislators/${legislatorId}`,
    legislatorVotes: (legislatorId: string) =>
        `legislators/${legislatorId}/votes`,
    legislatorDistricts: (chamber: string, district: string) =>
        `legislators/${chamber}/${district}`,
    legislatorSponsoredBills: (legislatorId: string) =>
        `legislators/${legislatorId}/sponsored`,
    legislatorAnalysis: (legislatorId: string, year: string) =>
        `legislators/${legislatorId}/${year}/analysis`,
};
