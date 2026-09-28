//"?session=2026GS" for the analysis routes that can narrow a year to one session, or "" for the whole year
const sessionQuery = (session?: string | null) =>
    session ? `?session=${encodeURIComponent(session)}` : "";

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
    analysisYears: "analysis/years",
    legislatureOverview: (year: string) => `analysis/overview/${year}`,
    //every legislator's couple scores with party - for comparing one legislator with the party medians
    legislatureCoupleScores: (year: string, session?: string | null) =>
        `analysis/scores/${year}${sessionQuery(session)}`,
    //session is optional on both - without it the outcomes cover the whole year
    policyOutcomes: (year: string, session?: string | null) =>
        `analysis/outcomes/${year}${sessionQuery(session)}`,
    policyCoupleOutcome: (
        year: string,
        policyCoupleName: string,
        session?: string | null,
    ) =>
        `analysis/outcomes/${year}/${policyCoupleName}${sessionQuery(session)}`,
    //session is optional - without it the scores are for the whole year
    analysisOfLegislator: (
        legislatorId: string,
        year: string,
        session?: string | null,
    ) => `analysis/${legislatorId}/${year}/${sessionQuery(session)}`,
    analysisOfLegislatorPolicy: (
        legislatorId: string,
        year: string,
        policyTopic: string,
        policyDirection: string,
    ) => `analysis/${legislatorId}/${year}/${policyTopic}/${policyDirection}`,
    analysisOfLegislatorPolicyCouple: (
        legislatorId: string,
        year: string,
        policyCoupleName: string,
        session?: string | null,
    ) =>
        `analysis/${legislatorId}/${year}/couple/${policyCoupleName}${sessionQuery(session)}`,
};
