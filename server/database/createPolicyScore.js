import Database from "./database.js";

async function generatePolicyDirectionScore(
    legislatorId,
    policyTopic,
    policyDirection,
    sessionId,
) {
    let db = new Database();
    await db.openDatabase();

    try {
        const policyTopicBills = await db.getBillsForPolicyTopic(
            sessionId,
            policyTopic,
        );

        const policyDirectionBills = await db.getBillsForPolicyDirection(
            sessionId,
            policyTopic,
            policyDirection,
        );

        const allLegislatorVotes =
            await db.getAllBillsAndVotesForLegislatorByPolicyDirection(
                legislatorId,
                policyTopic,
                policyDirection,
            );

        let billCount = allLegislatorVotes.length;
        let score = 0;
        let weightedScore = 0;
        let totalWeight = 0;
        let absentVotes = 0;
        for (const legislatorVote of allLegislatorVotes) {
            if (legislatorVote.vote == "absent") {
                absentVotes++;
                continue;
            }

            const policyWeight = getPolicyWeight(legislatorVote);

            if (legislatorVote.vote == "yes") {
                score++;
                weightedScore += policyWeight;
            }

            totalWeight += policyWeight;
        }
        let percentage = weightedScore / totalWeight;
        console.log(percentage);
    } catch (error) {
        console.log(error);
    }
}

function getPolicyWeight(policyVote) {
    const impactWeight = {
        low: 0.5,
        moderate: 1,
        high: 2,
    };

    const strengthWeight = {
        primary: 1,
        secondary: 0.5,
    };

    const i = impactWeight[policyVote.impact_level];
    const s = strengthWeight[policyVote.policy_topic_strength];
    const c = policyVote.confidence;

    return i * s * c;
}

const x = await generatePolicyDirectionScore(
    "ESCAML",
    "taxes_government_spending",
    "increase_taxes",
    "2026GS",
);
