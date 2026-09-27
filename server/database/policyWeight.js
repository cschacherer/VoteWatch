//how much a bill's policy counts toward a score - used for legislator couple scores (createPolicyScore.js)
//and for legislature outcome scores (policyOutcomes.js) so both use the same weighting
//impact (low .5, moderate 1, high 2) x strength (primary 1, secondary .5) x AI confidence (0-1)
export function getPolicyWeight(policy) {
    const impactWeight = {
        low: 0.5,
        moderate: 1,
        high: 2,
    };

    const strengthWeight = {
        primary: 1,
        secondary: 0.5,
    };

    const i = impactWeight[policy.impact_level];
    const s = strengthWeight[policy.policy_topic_strength];
    const c = policy.confidence;

    return i * s * c;
}
