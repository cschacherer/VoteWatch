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

async function generateCouplePolicyDirectionScore(
    legislatorId,
    year,
    policyTopic,
    policyCoupleName,
    leftPolicyDirection,
    rightPolicyDirection,
) {
    let db = new Database();
    await db.openDatabase();

    try {
        // const policyTopicBills = await db.getBillsForPolicyTopic(
        //     sessionId,
        //     policyTopic,
        // );

        const leftPolicyDirectionVotes =
            await db.getAllBillsAndVotesForLegislatorByPolicyDirection(
                legislatorId,
                policyTopic,
                leftPolicyDirection,
                year,
            );

        const rightPolicyDirectionVotes =
            await db.getAllBillsAndVotesForLegislatorByPolicyDirection(
                legislatorId,
                policyTopic,
                rightPolicyDirection,
                year,
            );

        //const year = sessionId.slice(0, 4);

        let allLeftVotes = leftPolicyDirectionVotes.length;
        let yesLeftVotes = 0;
        let noLeftVotes = 0;
        let absentLeftVotes = 0;
        let totalWeightedLeftVote = 0;
        let netWeightedLeftVote = 0;

        let allRightVotes = rightPolicyDirectionVotes.length;
        let yesRightVotes = 0;
        let noRightVotes = 0;
        let absentRightVotes = 0;
        let totalWeightedRightVote = 0;
        let netWeightedRightVote = 0;

        for (const leftVote of leftPolicyDirectionVotes) {
            if (leftVote.vote == "absent") {
                absentLeftVotes++;
                continue;
            }

            const policyWeight = getPolicyWeight(leftVote);
            totalWeightedLeftVote += policyWeight;

            if (leftVote.vote == "yes") {
                yesLeftVotes++;
                netWeightedLeftVote += policyWeight;
            } else if (leftVote.vote == "no") {
                noLeftVotes++;
                netWeightedLeftVote -= policyWeight;
            }

            totalWeightedLeftVote += policyWeight;
        }

        for (const rightVote of rightPolicyDirectionVotes) {
            if (rightVote.vote == "absent") {
                absentRightVotes++;
                continue;
            }

            const policyWeight = getPolicyWeight(rightVote);
            totalWeightedRightVote += policyWeight;

            if (rightVote.vote === "yes") {
                yesRightVotes++;
                netWeightedRightVote += policyWeight;
            } else if (rightVote.vote === "no") {
                noRightVotes++;
                netWeightedRightVote -= policyWeight;
            }
        }

        const totalWeight = totalWeightedLeftVote + totalWeightedRightVote;

        let score = 50;

        if (totalWeight > 0) {
            const netCoupleScore = netWeightedRightVote - netWeightedLeftVote;

            score = 50 + 50 * (netCoupleScore / totalWeight);
        }

        const includedVotes =
            yesLeftVotes + noLeftVotes + yesRightVotes + noRightVotes;

        const result = await db.addToLegislatorScorePolicyTopicCouples(
            legislatorId,
            year,
            policyCoupleName,
            includedVotes,
            score,
        );
    } catch (error) {
        console.log(error);
    }
}

async function generateSinglePolicyDirectionScore(
    legislatorId,
    policyTopic,
    policyDirection,
    sessionId,
) {
    let db = new Database();
    await db.openDatabase();

    try {
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
        // for (const policy of policyTopics) {
        //     const topic = policy.topic;

        //     for (const policy_couples of policy.policyCouples) {
        //         // const result = await generatePolicyDirectionScore(
        //         //     legislator_id,
        //         //     topic,
        //         //     direction,
        //         //     "2026GS",
        //         // );
        //     }
        //     for (const policy_couples of policy.policySingles) {
        //         // const result = await generatePolicyDirectionScore(
        //         //     legislator_id,
        //         //     topic,
        //         //     direction,
        //         //     "2026GS",
        //         // );
        //     }
        //     //console.log(topic);
        //     for (const direction of policy.policyDirections) {
        //         const result = await generatePolicyDirectionScore(
        //             legislator_id,
        //             topic,
        //             direction,
        //             "2026GS",
        //         );
        //     }
        // }
        for (const policy of policyTopics) {
            const topic = policy.topic;
            for (const couple of policy.policyCouples) {
                const policyCoupleName = couple.policyCoupleName;

                const result = await generateCouplePolicyDirectionScore(
                    legislator_id,
                    "2026",
                    topic,
                    policyCoupleName,
                    couple.leftPolicyDirection,
                    couple.rightPolicyDirection,
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

//await createAllPolicyScores("PETERT");

//await createScoresForAllLegislators();

// async function generatePolicyTopicTable() {
//     let db = new Database();
//     await db.openDatabase();

//     try {
//         let policyTopics = createPolicyTopics();

//         for (const policy of policyTopics) {
//             const topic = policy.topic;
//             console.log(topic);
//             // for (const direction of policy.policyDirections) {
//             //     const result = await db.addToPolicyTopic(topic, direction);
//             // }
//             for (const couple of policy.policyCouples) {
//                 const result = await db.addToPolicyTopicCouples(
//                     topic,
//                     couple.policyCoupleName,
//                     couple.nameLabel,
//                     couple.leftPolicyDirection,
//                     couple.rightPolicyDirection,
//                 );
//             }
//             for (const single of policy.policySingles) {
//                 const result = await db.addToPolicyTopicSingles(
//                     topic,
//                     single.nameLabel,
//                     single.policyDirection,
//                 );
//             }
//         }
//     } catch (error) {
//         console.log(error);
//     }
// }

// await generatePolicyTopicTable();
