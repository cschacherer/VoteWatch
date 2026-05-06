export type LegislatorPolicyScore = {
    legislatorId: string;
    policyTopic: string;
    policyDirection: string;
    score: string;
    year: string;
    allVotes: number;
    includedVotes: number;
    yesVotes: number;
    absentPercentage: number;
};

export const createLegislatorPolicyScore = (
    raw: any,
): LegislatorPolicyScore => {
    if (typeof raw !== "object" || raw === null) {
        throw new Error("Invalid legislator policy payload");
    }

    if (raw.score == null) {
        raw.score = "N/A";
    }

    let allVotes = Number(raw.all_votes ?? 0);
    let includedVotes = Number(raw.included_votes ?? 0);
    let yesVotes = Number(raw.yes_votes ?? 0);
    let absentPercentage = (allVotes - includedVotes) / allVotes;

    return {
        legislatorId: String(raw.legislator_id ?? ""),
        policyTopic: String(raw.policy_topic ?? ""),
        policyDirection: String(raw.policy_direction ?? ""),
        score: String(raw.score ?? ""),
        year: String(raw.year ?? ""),
        allVotes: allVotes,
        includedVotes: includedVotes,
        yesVotes: yesVotes,
        absentPercentage: absentPercentage,
    };
};
