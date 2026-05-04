//GET ALL LEGISLATORS FROM THE GOVERNMENT WEBSITE AND API
import { AI_TOKEN, AI_BASE_URL, AI_MODEL } from "./constants.js";
import { createPolicyTopics } from "./policyTopics.js";

//all general policies and thier policy direction topics
//ie - housing_land_use and increase_housing_supply
const policyTopics = createPolicyTopics();

const TOPIC_ENUM = policyTopics.map((t) => t.topic);
const POLICY_DIRECTION_ENUM = policyTopics.flatMap((t) => t.policyDirections);

const policyTopicPromptText = JSON.stringify(policyTopics, null, 2);

//this calls the utah government legislator API and returns JSON responses
export const getPolicyClassificationsForBills = async (bill) => {
    try {
        const response = await fetch(AI_BASE_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${AI_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: AI_MODEL,
                messages: [
                    {
                        role: "system",
                        content: `
You are a policy classification system.

Your job is to convert a legislative bill summary into structured policy topic entries.

STRICT RULES:
- Use ONLY the provided summary and the provided subject tags for each bill.
- The summary is the primary source of truth.
- If subjects conflict with the summary, follow the summary and set needs_review = true.
- Do not create a topic solely because it appears in subjects unless the summary also supports it.
- Do not use outside knowledge.
- Do not guess intent, politics, or motivations.
- Be neutral, factual, and consistent.
- Output must match the JSON schema exactly.
- Each topic entry should represent a distinct policy effect of the bill.
- Most bills should have 1 topic.
- Some bills may have 2 topics.
- Rare bills may have 3 topics.
- Never create more than 3 topic entries.
- If the bill is mostly technical, conforming, renumbering, or administrative, set is_substantive to false and topics to [].

Classify the bill using ONLY the topic-to-policy-direction mapping below.

Each object contains:
- topic: the only allowed topic value
- policyDirections: the only allowed policy_direction values for that topic

Rules:
- topic must exactly match one of the topic values in the mapping.
- policy_direction must exactly match one of the policyDirections values for that same topic.
- Do not invent topics.
- Do not invent policy directions.

POLICY TOPIC RULES:
- Use only the topic-to-policy-direction mapping provided by the user.
- The topic field must exactly match one of the provided topic values.
- The policy_direction field must exactly match one of the policyDirections values for the same topic.
- Never pair a topic with a policy_direction that belongs to a different topic.
- Do not invent new topics or policy directions.
- Choose exactly one primary topic if is_substantive is true.
- Choose up to two secondary topics only if they are meaningfully affected.
- topic_strength must be "primary" for the main purpose and "secondary" for meaningful side effects.

POLICY DIRECTION RULES:
- policy_direction must describe what the bill does.
- policy_direction must not describe whether the bill is good or bad.
- Each topic must have exactly one policy_direction.
- The policy_direction must logically match the topic.

IMPACT LEVEL:
- low = minor, narrow, technical, or limited practical effect
- moderate = meaningful policy change
- high = major structural, funding, enforcement, rights, regulatory, or statewide change

CONFIDENCE:
- Use 0.90 to 1.00 only when the summary clearly supports the classification.
- Use 0.70 to 0.89 when classification is likely but some nuance exists.
- Use below 0.70 when classification is uncertain.
- If any important classification is unclear, set needs_review to true.

neutral_summary_for_scorecard:
- One sentence.
- Factual and neutral.
- Describe the policy effect, not political meaning.

review_reason:
- If needs_review is true, briefly explain why.
- If needs_review is false, return an empty string.
                `.trim(),
                    },
                    {
                        role: "user",
                        content: `
Classify the following Utah bill summary.

Return ONLY valid JSON.

Classify the bill using ONLY these topics and policy directions.

Use the bill subjects as supporting metadata to help identify topics, but do not rely on subjects alone if they conflict with the summary.

Allowed topic-to-policy-direction mapping:
${policyTopicPromptText}

Bill metadata:
- Bill ID: ${bill.id}
- Year: ${bill.year}
- Session ID: ${bill.session_id}
- Short title: ${bill.short_title}
- Subjects: ${JSON.stringify(bill.subjects ?? [], null, 2)}

Summary:
${bill.summary_text}
                `.trim(),
                    },
                ],

                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: "bill_policy_classification",
                        strict: true,
                        schema: {
                            type: "object",
                            properties: {
                                bill_id: { type: "string" },
                                is_substantive: { type: "boolean" },
                                topics: {
                                    type: "array",
                                    minItems: 0,
                                    maxItems: 3,
                                    items: {
                                        type: "object",
                                        properties: {
                                            topic: {
                                                type: "string",
                                                enum: TOPIC_ENUM,
                                            },
                                            topic_strength: {
                                                type: "string",
                                                enum: ["primary", "secondary"],
                                            },
                                            policy_direction: {
                                                type: "string",
                                                enum: POLICY_DIRECTION_ENUM,
                                            },
                                            impact_level: {
                                                type: "string",
                                                enum: [
                                                    "low",
                                                    "moderate",
                                                    "high",
                                                ],
                                            },
                                            confidence: {
                                                type: "number",
                                                minimum: 0,
                                                maximum: 1,
                                            },
                                            neutral_summary_for_scorecard: {
                                                type: "string",
                                            },
                                        },
                                        required: [
                                            "topic",
                                            "topic_strength",
                                            "policy_direction",
                                            "impact_level",
                                            "confidence",
                                            "neutral_summary_for_scorecard",
                                        ],
                                        additionalProperties: false,
                                    },
                                },
                                needs_review: { type: "boolean" },
                                review_reason: { type: "string" },
                                measure_type: {
                                    type: "string",
                                    enum: [
                                        "substantive_policy",
                                        "symbolic_resolution",
                                        "technical_admin",
                                    ],
                                },
                            },
                            required: [
                                "bill_id",
                                "is_substantive",
                                "topics",
                                "needs_review",
                                "review_reason",
                                "measure_type",
                            ],
                            additionalProperties: false,
                        },
                    },
                },
            }),
        });
        if (response.ok) {
            const data = await response.json();
            const billPoliciesString = data.choices[0].message.content;
            const billPolicies = JSON.parse(billPoliciesString);
            return billPolicies;
        } else {
            console.log(response.status + " " + response.statusText);
        }
        return "";
    } catch (err) {
        console.log(`Error: ${err.message}`);
    }
};

//this calls the utah government legislator API and returns JSON responses
// export const test = async (bill) => {
//     try {
//         const response = await fetch(AI_BASE_URL, {
//             method: "POST",
//             headers: {
//                 Authorization: `Bearer ${AI_TOKEN}`,
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//                 model: AI_MODEL,
//                 messages: [
//                     {
//                         role: "system",
//                         content: `You are a math teacher
//                         `.trim(),
//                     },
//                     {
//                         role: "user",
//                         content:
//                             `Generate a math problem for a fifth grader`.trim(),
//                     },
//                 ],
//             }),
//         });
//         if (response.ok) {
//             const data = await response.json();
//             const summary = data.choices[0].message.content;
//             console.log(summary);
//             return summary;
//         } else {
//             console.log(response.status + " " + response.statusText);
//         }
//         return "";
//     } catch (err) {
//         console.log(`Error: ${err.message}`);
//     }
// };

// await test();
