import Database from "./database.js";
import { PolicyTopic, createPolicyTopics } from "./policyTopics.js";

async function generatePolicyDirectionScore(
    legislatorId,
    policyTopic,
    policyDirection,
    sessionId,
) {
    let db = new Database();
    await db.openDatabase();

    try {
        // const policyTopicBills = await db.getBillsForPolicyTopic(
        //     sessionId,
        //     policyTopic,
        // );

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
                sessionId,
            );

        const year = sessionId.slice(0, 4);

        let allVotes = allLegislatorVotes.length;
        let includedVotes = 0;
        let yesVotes = 0;
        let weightedScore = 0;
        let totalWeight = 0;
        let absentVotes = 0;
        for (const legislatorVote of allLegislatorVotes) {
            if (legislatorVote.vote == "absent") {
                absentVotes++;
                continue;
            }

            includedVotes++;

            const policyWeight = getPolicyWeight(legislatorVote);

            if (legislatorVote.vote == "yes") {
                yesVotes++;
                weightedScore += policyWeight;
            }

            totalWeight += policyWeight;
        }
        let percentage = weightedScore / totalWeight;
        //console.log(percentage);

        const result = await db.addToPolicyScore(
            legislatorId,
            year,
            policyTopic,
            policyDirection,
            percentage,
            allVotes,
            includedVotes,
            yesVotes,
        );
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

// const x = await generatePolicyDirectionScore(
//     "ESCAML",
//     "taxes_government_spending",
//     "increase_taxes",
//     "2026GS",
// );

async function createAllPolicyScores(legislator_id) {
    try {
        let policyTopics = createPolicyTopics();
        for (const policy of policyTopics) {
            const topic = policy.topic;
            //console.log(topic);
            for (const direction of policy.policyDirections) {
                const result = await generatePolicyDirectionScore(
                    legislator_id,
                    topic,
                    direction,
                    "2026GS",
                );
            }
        }
    } catch (e) {
        console.log(e);
    }
}

async function createScoresForAllLegislators() {
    try {
        let db = new Database();
        await db.openDatabase();

        //await db.createPolicyScoreTable();

        let allLegislators = await db.getAllLegislators();

        for (const legislator of allLegislators) {
            const leg_id = legislator.id;
            console.log(leg_id);
            await createAllPolicyScores(leg_id);
        }
    } catch (e) {
        console.log(e);
    }
}

await createScoresForAllLegislators();

// async function generatePolicyTopicTable() {
//     let db = new Database();
//     await db.openDatabase();

//     try {
//         let policyTopics = createPolicyTopics();

//         for (const policy of policyTopics) {
//             const topic = policy.topic;
//             console.log(topic);
//             for (const direction of policy.policyDirections) {
//                 const result = await db.addToPolicyTopic(topic, direction);
//             }
//         }
//     } catch (error) {
//         console.log(error);
//     }
// }

// await generatePolicyTopicTable();
