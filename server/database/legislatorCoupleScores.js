import { getPolicyWeight } from "./policyWeight.js";

//a legislator's couple scores computed live from their votes - the same math as
//generateCouplePolicyDirectionScore in createPolicyScore.js (checked equal to every stored 2026 score),
//used when there are no stored scores to read, ie for one session or a year that was never scored.
//couples: policy_topic_couples rows. voteRows: one row per vote on a bill whose policy is on either side
//of a couple (policy_topic_couple_name, vote, policy_direction, impact_level, policy_topic_strength, confidence)
export function buildLegislatorCoupleScores(couples, voteRows, legislatorId, year) {
    const totals = new Map();
    for (const couple of couples) {
        totals.set(couple.policy_topic_couple_name, {
            netLeft: 0,
            netRight: 0,
            totalWeight: 0,
            includedVotes: 0,
        });
    }

    for (const row of voteRows) {
        const total = totals.get(row.policy_topic_couple_name);
        //absent votes aren't scored
        if (!total || row.vote === "absent") continue;

        const couple = couples.find(
            (c) => c.policy_topic_couple_name === row.policy_topic_couple_name,
        );
        const weight = getPolicyWeight(row);
        //yes adds weight to the bill's side, no takes it away
        const signedWeight =
            row.vote === "yes" ? weight : row.vote === "no" ? -weight : 0;

        if (row.policy_direction === couple.right_policy_direction) {
            total.netRight += signedWeight;
        } else {
            total.netLeft += signedWeight;
        }
        total.totalWeight += weight;
        if (row.vote === "yes" || row.vote === "no") total.includedVotes++;
    }

    //same shape as getPolicyCouplesFromLegislatorAndYear so the client reads either one
    return couples.map((couple) => {
        const total = totals.get(couple.policy_topic_couple_name);
        const score =
            total.totalWeight > 0
                ? 50 + 50 * ((total.netRight - total.netLeft) / total.totalWeight)
                : 50;

        return {
            legislator_id: legislatorId,
            year,
            policy_topic: couple.policy_topic,
            policy_topic_couple_name: couple.policy_topic_couple_name,
            name_label: couple.name_label,
            left_policy_direction: couple.left_policy_direction,
            right_policy_direction: couple.right_policy_direction,
            all_included_votes: total.includedVotes,
            score,
        };
    });
}
