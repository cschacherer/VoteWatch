import type { WeightedPolicy } from "../types.js";

const IMPACT_WEIGHT: Record<string, number> = {
    low: 0.5,
    moderate: 1,
    high: 2,
};

const STRENGTH_WEIGHT: Record<string, number> = {
    primary: 1,
    secondary: 0.5,
};

//how much a bill's policy counts toward a score - used for legislator couple scores and legislature
//outcome scores, so both weigh bills the same way
//impact (low .5, moderate 1, high 2) x strength (primary 1, secondary .5) x AI confidence (0-1)
//
//the same formula as server/database/policyWeight.js, which the JavaScript ETL's createPolicyScore.js uses
//to write the stored scores - change both together. Like the JavaScript, an unknown impact or strength
//gives NaN
export function getPolicyWeight(policy: WeightedPolicy): number {
    const impact = IMPACT_WEIGHT[policy.impact_level ?? ""] ?? NaN;
    const strength = STRENGTH_WEIGHT[policy.policy_topic_strength ?? ""] ?? NaN;
    return impact * strength * Number(policy.confidence);
}
