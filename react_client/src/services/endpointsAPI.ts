export const endpointsAPI = {
    // BILLS
    bills: "/bills",
    billDetails: (sessionId: string, billId: string) =>
        `bills/${sessionId}/${billId}`,
    billVotes: (sessionId: string, billId: string) =>
        `bills/${sessionId}/${billId}/votes`,
    // LEGISLATORS
    legislators: "/legislators",
    legislatorDetails: (legislatorId: string) => `legislators/${legislatorId}`,
    legislatorVotes: (legislatorId: string) =>
        `legislators/${legislatorId}/votes`,
    legislatorDistricts: (chamber: string, district: string) =>
        `legislators/${chamber}/${district}`,
    legislatorSponsoredBills: (legislatorId: string) =>
        `legislators/${legislatorId}/sponsored`,
    // ANALYSIS
    analysisOfLegislator: (legislatorId: string, year: string) =>
        `analysis/${legislatorId}/${year}/`,
    analysisOfLegislatorPolicy: (
        legislatorId: string,
        year: string,
        policyTopic: string,
        policyDirection: string,
    ) => `analysis/${legislatorId}/${year}/${policyTopic}/${policyDirection}`,
};
