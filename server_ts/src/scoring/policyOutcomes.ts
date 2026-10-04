import {
    createPolicyTopics,
    type PolicyTopicCouple,
} from "../taxonomy/policyTopics.js";
import type { WeightedPolicy } from "../types.js";
import { getPolicyWeight } from "./policyWeight.js";

//one row per (bill, policy topic) - the input to buildPolicyOutcomes
export type OutcomePolicyRow = WeightedPolicy & {
    session_id: string;
    bill_id: string;
    policy_topic: string;
    policy_direction: string;
    passed: boolean | null;
};

type DirectionSummary = { direction: string; bills: number; passed: number };

export type TopicOutcome = {
    policy_topic: string;
    bills: number;
    passed: number;
    couples: {
        policy_topic_couple_name: string;
        name_label: string;
        left: DirectionSummary;
        right: DirectionSummary;
        outcome_score: number | null;
    }[];
    other_directions: DirectionSummary[];
};

//0-100 outcome score from the summed weights of the passed bills on each side - null if nothing passed
export function outcomeScoreFromWeights(
    leftWeight: number,
    rightWeight: number,
): number | null {
    const totalWeight = leftWeight + rightWeight;
    return totalWeight > 0
        ? 50 + 50 * ((rightWeight - leftWeight) / totalWeight)
        : null;
}

//finds a couple (and its topic) in the taxonomy by couple name
export function findPolicyCouple(
    policyCoupleName: string,
): { topic: string; couple: PolicyTopicCouple } | null {
    for (const topic of createPolicyTopics()) {
        const couple = topic.policyCouples.find(
            (c: PolicyTopicCouple) => c.policyCoupleName === policyCoupleName,
        );
        if (couple) return { topic: topic.topic, couple };
    }
    return null;
}

//what the legislature as a whole passed, per policy topic and direction
//
//a couple's outcome score uses the same formula and weights as legislator couple scores, but each
//PASSED bill counts toward its own direction: 0 = everything passed pushed toward the left direction,
//100 = everything passed pushed toward the right, null = nothing passed on either side
export function buildPolicyOutcomes(rows: OutcomePolicyRow[]): TopicOutcome[] {
    const policyTopics = createPolicyTopics();

    //direction stats keyed by "topic|direction" - only directions that belong to their topic count,
    //so bills the AI filed under the wrong topic are left out
    const directionStats = new Map<
        string,
        { bills: number; passed: number; passedWeight: number }
    >();
    const topicBills = new Map<string, Set<string>>();
    const topicPassedBills = new Map<string, Set<string>>();

    for (const row of rows) {
        const topic = policyTopics.find((t) => t.topic === row.policy_topic);
        if (!topic || !topic.policyDirections.includes(row.policy_direction)) {
            continue;
        }

        const passed = row.passed === true;
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
        topicBills.get(row.policy_topic)!.add(billKey);
        if (passed) topicPassedBills.get(row.policy_topic)!.add(billKey);
    }

    const directionSummary = (
        topic: string,
        direction: string,
    ): DirectionSummary => {
        const stats = directionStats.get(`${topic}|${direction}`);
        return {
            direction,
            bills: stats?.bills ?? 0,
            passed: stats?.passed ?? 0,
        };
    };

    return policyTopics
        .map((topic): TopicOutcome => {
            const coupledDirections = new Set<string>();

            const couples = topic.policyCouples.map(
                (couple: PolicyTopicCouple) => {
                    coupledDirections.add(couple.leftPolicyDirection);
                    coupledDirections.add(couple.rightPolicyDirection);

                    const passedWeight = (direction: string) =>
                        directionStats.get(`${topic.topic}|${direction}`)
                            ?.passedWeight ?? 0;

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
                            passedWeight(couple.leftPolicyDirection),
                            passedWeight(couple.rightPolicyDirection),
                        ),
                    };
                },
            );

            //directions that aren't part of any couple (ie "reallocate_spending") still get pass rates
            const otherDirections = (topic.policyDirections as string[])
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
