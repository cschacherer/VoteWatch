export const endpointsAPI = {
    bills: "/bills",
    billDetails: (billId: string) => `bills/${billId}`,
    legislators: "/legislators",
    legislatorDetails: (legislatorId: string) => `legislators/${legislatorId}`,
    legislatorVotes: (legislatorId: string) =>
        `legislators/${legislatorId}/votes`,
};
