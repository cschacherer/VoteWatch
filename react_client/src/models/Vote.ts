export const VoteValue = {
    Yes: "YES",
    No: "NO",
    Absent: "ABSENT",
} as const;

export type VoteValue = (typeof VoteValue)[keyof typeof VoteValue];

export type Vote = {
    sessionId: string;
    billId: string;
    house: string;
    legislatorId: string;
    legislatorName: string;
    vote: VoteValue;
};

export const createVote = (raw: any): Vote => {
    if (typeof raw !== "object" || raw === null) {
        throw new Error("Invalid vote payload");
    }

    const voteValue = String(raw.vote ?? "").toUpperCase();

    if (!Object.values(VoteValue).includes(voteValue as VoteValue)) {
        throw new Error(`Invalid vote value: ${raw.vote}`);
    }

    return {
        sessionId: String(raw.session_id ?? ""),
        billId: String(raw.bill_id ?? ""),
        house: String(raw.house ?? ""),
        legislatorId: String(raw.legislator_id ?? ""),
        legislatorName: String(raw.full_name ?? ""),
        vote: voteValue as VoteValue,
    };
};
