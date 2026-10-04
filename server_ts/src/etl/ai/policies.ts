import { createPolicyTopics } from "../../taxonomy/policyTopics.js";
import { chatCompletionJson, type AiBill } from "./client.js";

//classifies a bill's summary into policy topics and directions from the taxonomy - the prompt and schema
//are copied word for word from the JavaScript ETL's getPoliciesFromAI.js. Keep its rules neutral and
//nonpartisan. The schema's enums are the taxonomy's topics and directions, so the LLM can't invent any

const policyTopics = createPolicyTopics();
const TOPIC_ENUM = policyTopics.map((t) => t.topic);
const POLICY_DIRECTION_ENUM = policyTopics.flatMap((t) => t.policyDirections);
const policyTopicPromptText = JSON.stringify(policyTopics, null, 2);

export type PolicyClassification = {
    bill_id: string;
    is_substantive: boolean;
    topics: {
        topic: string;
        topic_strength: "primary" | "secondary";
        policy_direction: string;
        impact_level: "low" | "moderate" | "high";
        confidence: number;
        neutral_summary_for_scorecard: string;
    }[];
    needs_review: boolean;
    review_reason: string;
    measure_type:
        | "substantive_policy"
        | "symbolic_resolution"
        | "technical_admin";
};

const SYSTEM_PROMPT = `
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
                `.trim();

const userPrompt = (bill: AiBill) =>
    `
Classify the following Utah bill summary.

Return ONLY valid JSON.

Classify the bill using ONLY these topics and policy directions.

Use the bill subjects as supporting metadata to help identify topics, but do not rely on subjects alone if they conflict with the summary.

Allowed topic-to-policy-direction mapping:
${policyTopicPromptText}

Bill metadata:
- Bill ID: ${bill.bill_number}
- Year: ${bill.year}
- Session ID: ${bill.session_code}
- Short title: ${bill.short_title}
- Subjects: ${JSON.stringify(bill.subjects ?? [], null, 2)}

Summary:
${bill.summary_text}
                `.trim();

const CLASSIFICATION_SCHEMA = {
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
                        enum: ["low", "moderate", "high"],
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
};

//null when the LLM call fails or doesn't return valid JSON
export async function getPolicyClassification(
    bill: AiBill,
): Promise<PolicyClassification | null> {
    const json = await chatCompletionJson(
        [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt(bill) },
        ],
        "bill_policy_classification",
        CLASSIFICATION_SCHEMA,
    );
    if (!json) return null;
    try {
        return JSON.parse(json) as PolicyClassification;
    } catch {
        console.log(
            `LLM classification for ${bill.bill_number} wasn't valid JSON`,
        );
        return null;
    }
}
