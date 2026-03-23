export const VoteValue = {
    Yes: "YES",
    No: "NO",
    Absent: "ABSENT",
} as const;

export type VoteValue = (typeof VoteValue)[keyof typeof VoteValue];

export type Vote = {
    year: string;
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
        year: String(raw.year ?? ""),
        billId: String(raw.billId ?? ""),
        house: String(raw.house ?? ""),
        legislatorId: String(raw.legislatorId ?? ""),
        legislatorName: String(raw.legislatorName ?? ""),
        vote: voteValue as VoteValue,
    };
};
