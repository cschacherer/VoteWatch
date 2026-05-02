import { VoteValue } from "./Vote";
import { type Bill, createBillFromVote } from "./Bill";

export type LegislatorVote = {
    legislatorId: string;
    legislatorName: string;
    vote: VoteValue;

    bill: Bill;
};

export const createLegislatorVote = (raw: any): LegislatorVote => {
    if (typeof raw !== "object" || raw === null) {
        throw new Error("Invalid vote payload");
    }

    const voteValue = String(raw.vote ?? "").toUpperCase();
    const billValue = createBillFromVote(raw);

    if (!Object.values(VoteValue).includes(voteValue as VoteValue)) {
        throw new Error(`Invalid vote value: ${raw.vote}`);
    }

    return {
        legislatorId: String(raw.legislator_id ?? ""),
        legislatorName: String(raw.legislatorName ?? ""),
        vote: voteValue as VoteValue,
        bill: billValue,
    };
};
