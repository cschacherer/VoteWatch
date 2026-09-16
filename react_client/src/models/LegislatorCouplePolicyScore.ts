export type LegislatorCouplePolicyScore = {
    legislatorId: string;
    year: string;
    policyTopic: string;
    policyCoupleName: string;
    policyNameLabel: string;
    score: string;
    allIncludedVotes: number;
    leftPolicyDirection: string;
    rightPolicyDirection: string;
};

export const createLegislatorCouplePolicyScore = (
    raw: any,
): LegislatorCouplePolicyScore => {
    if (typeof raw !== "object" || raw === null) {
        throw new Error("Invalid legislator couple policy score payload");
    }

    return {
        legislatorId: String(raw.legislator_id ?? ""),
        year: String(raw.year ?? ""),
        policyTopic: String(raw.policy_topic ?? ""),
        policyCoupleName: String(raw.policy_topic_couple_name ?? ""),
        policyNameLabel: String(raw.name_label ?? ""),
        score: raw.score == null ? "N/A" : String(raw.score),
        allIncludedVotes: Number(raw.all_included_votes ?? 0),
        leftPolicyDirection: String(raw.left_policy_direction ?? ""),
        rightPolicyDirection: String(raw.right_policy_direction ?? ""),
    };
};
