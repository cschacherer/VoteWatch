import { type Vote, VoteValue, createVote } from "./Vote";
import { type Bill, createBill } from "./Bill";

export type LegislatorVote = {
    year: string;
    billId: string;
    house: string;
    legislatorId: string;
    legislatorName: string;
    vote: VoteValue;

    shortTitle: string;
    generalProvisions: string;
    lastAction: string;
    lastActionDate: string;
    sessionId: string;
    link: string;
    subjects: string;
};

export const createLegislatorVote = (raw: any): LegislatorVote => {
    if (typeof raw !== "object" || raw === null) {
        throw new Error("Invalid vote payload");
    }

    const voteValue = String(raw.vote ?? "").toUpperCase();

    if (!Object.values(VoteValue).includes(voteValue as VoteValue)) {
        throw new Error(`Invalid vote value: ${raw.vote}`);
    }

    return {
        shortTitle: String(raw.shortTitle ?? ""),

        generalProvisions: String(raw.generalProvisions ?? ""),

        lastAction: String(raw.lastAction ?? ""),
        lastActionDate: String(raw.lastActionDate ?? ""),

        year: String(raw.year ?? 0),
        sessionId: String(raw.sessionId ?? ""),

        link: String(raw.link ?? ""),
        subjects: String(raw.subjects ?? ""),

        billId: String(raw.billId ?? ""),
        house: String(raw.house ?? ""),
        legislatorId: String(raw.legislatorId ?? ""),
        legislatorName: String(raw.legislatorName ?? ""),
        vote: voteValue as VoteValue,
    };
};
