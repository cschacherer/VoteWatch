import { createPolicyTopics } from "./policyTopics.js";
import { getPolicyWeight } from "./policyWeight.js";

//0-100 outcome score from the summed weights of the passed bills on each side - null if nothing passed
export function outcomeScoreFromWeights(leftWeight, rightWeight) {
    const totalWeight = leftWeight + rightWeight;
    return totalWeight > 0
        ? 50 + 50 * ((rightWeight - leftWeight) / totalWeight)
        : null;
}

//finds a couple (and its topic) in policyTopics.js by couple name
export function findPolicyCouple(policyCoupleName) {
    for (const topic of createPolicyTopics()) {
        const couple = topic.policyCouples.find(
            (c) => c.policyCoupleName === policyCoupleName,
        );
        if (couple) return { topic: topic.topic, couple };
    }
    return null;
}

//what the legislature as a whole passed, per policy topic and direction
//rows: one per (bill, policy topic) with policy_topic, policy_direction, impact_level,
//policy_topic_strength, confidence, session_id, bill_id, and passed from the bills table
//
//outcome score for a couple uses the same formula and weights as legislator couple scores, but each
//PASSED bill counts toward its own direction: 0 = everything passed pushed toward the left direction,
//100 = everything passed pushed toward the right, null = nothing passed on either side
export function buildPolicyOutcomes(rows) {
    const policyTopics = createPolicyTopics();

    //direction stats keyed by "topic|direction" - only directions that belong to their topic count,
    //so bills the AI filed under the wrong topic are left out
    const directionStats = new Map();
    const topicBills = new Map();
    const topicPassedBills = new Map();

    for (const row of rows) {
        const topic = policyTopics.find((t) => t.topic === row.policy_topic);
        if (!topic || !topic.policyDirections.includes(row.policy_direction)) {
            continue;
        }

        const passed = row.passed === "true" || row.passed === 1;
        const billKey = `${row.session_id}|${row.bill_id}`;
        const key = `${row.policy_topic}|${row.policy_direction}`;

        const stats = directionStats.get(key) ?? {
            bills: 0,
            passed: 0,
            passedWeight: 0,
        };
        stats.bills++;
        if (passed) {
            stats.passed++;
            stats.passedWeight += getPolicyWeight(row);
        }
        directionStats.set(key, stats);

        if (!topicBills.has(row.policy_topic)) {
            topicBills.set(row.policy_topic, new Set());
            topicPassedBills.set(row.policy_topic, new Set());
        }
        topicBills.get(row.policy_topic).add(billKey);
        if (passed) topicPassedBills.get(row.policy_topic).add(billKey);
    }

    const directionSummary = (topic, direction) => {
        const stats = directionStats.get(`${topic}|${direction}`);
        return {
            direction,
            bills: stats?.bills ?? 0,
            passed: stats?.passed ?? 0,
        };
    };

    return policyTopics
        .map((topic) => {
            const coupledDirections = new Set();

            const couples = topic.policyCouples.map((couple) => {
                coupledDirections.add(couple.leftPolicyDirection);
                coupledDirections.add(couple.rightPolicyDirection);

                const leftWeight =
                    directionStats.get(
                        `${topic.topic}|${couple.leftPolicyDirection}`,
                    )?.passedWeight ?? 0;
                const rightWeight =
                    directionStats.get(
                        `${topic.topic}|${couple.rightPolicyDirection}`,
                    )?.passedWeight ?? 0;

                return {
                    policy_topic_couple_name: couple.policyCoupleName,
                    name_label: couple.nameLabel,
                    left: directionSummary(
                        topic.topic,
                        couple.leftPolicyDirection,
                    ),
                    right: directionSummary(
                        topic.topic,
                        couple.rightPolicyDirection,
                    ),
                    outcome_score: outcomeScoreFromWeights(
                        leftWeight,
                        rightWeight,
                    ),
                };
            });

            //directions that aren't part of any couple (ie "reallocate_spending") still get pass rates
            const otherDirections = topic.policyDirections
                .filter((direction) => !coupledDirections.has(direction))
                .map((direction) => directionSummary(topic.topic, direction))
                .filter((summary) => summary.bills > 0);

            return {
                policy_topic: topic.topic,
                bills: topicBills.get(topic.topic)?.size ?? 0,
                passed: topicPassedBills.get(topic.topic)?.size ?? 0,
                couples,
                other_directions: otherDirections,
            };
        })
        .filter((topic) => topic.bills > 0)
        .sort((a, b) => b.bills - a.bills);
}
