export const endpointsAPI = {
    bills: "/bills",
    billDetails: (billId: string) => `bills/${billId}`,
    billVotes: (billId: string, year: string) =>
        `bills/${year}/${billId}/votes`,
    legislators: "/legislators",
    legislatorDetails: (legislatorId: string) => `legislators/${legislatorId}`,
    legislatorVotes: (legislatorId: string) =>
        `legislators/${legislatorId}/votes`,
};
