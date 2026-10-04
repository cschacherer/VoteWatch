import type {
    CoupleScoreRow,
    CoupleVoteRow,
    PolicyTopicCoupleRow,
} from "../types.js";
import { getPolicyWeight } from "./policyWeight.js";

type CoupleTotals = {
    netLeft: number;
    netRight: number;
    totalWeight: number;
    includedVotes: number;
};

//a legislator's couple scores computed live from their votes - the same math as the JavaScript ETL's
//generateCouplePolicyDirectionScore (createPolicyScore.js), which was checked equal to every stored 2026
//score. Used when there are no stored scores to read, ie one session, all years, or an unscored year
//
//score = 50 + 50 x (netRight - netLeft) / total weight: yes adds a bill's weight to its side, no takes it
//away, absent is skipped. 0 = every counted vote toward the left direction, 100 = toward the right
export function buildLegislatorCoupleScores(
    couples: PolicyTopicCoupleRow[],
    voteRows: CoupleVoteRow[],
    legislatorId: string,
    year: string,
): CoupleScoreRow[] {
    const coupleByName = new Map(
        couples.map((couple) => [couple.policy_topic_couple_name, couple]),
    );
    const totals = new Map<string, CoupleTotals>(
        couples.map((couple) => [
            couple.policy_topic_couple_name,
            { netLeft: 0, netRight: 0, totalWeight: 0, includedVotes: 0 },
        ]),
    );

    for (const row of voteRows) {
        const total = totals.get(row.policy_topic_couple_name);
        const couple = coupleByName.get(row.policy_topic_couple_name);
        //absent votes aren't scored
        if (!total || !couple || row.vote === "absent") continue;

        const weight = getPolicyWeight(row);
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

    //the same row shape as the stored scores, so callers can't tell them apart
    return couples.map((couple) => {
        const total = totals.get(couple.policy_topic_couple_name)!;
        const score =
            total.totalWeight > 0
                ? 50 +
                  50 * ((total.netRight - total.netLeft) / total.totalWeight)
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
