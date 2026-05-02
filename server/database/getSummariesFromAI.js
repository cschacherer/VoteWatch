//GET ALL LEGISLATORS FROM THE GOVERNMENT WEBSITE AND API
import { AI_TOKEN, AI_BASE_URL, AI_MODEL } from "./constants.js";

//this calls the utah government legislator API and returns JSON responses
export const getBillSummary = async (bill) => {
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
You are a nonpartisan legislative analyst.

Your job is to explain Utah bills in clear, plain English for ordinary readers who may not be familiar with legal or government terminology.

Rules:
- Be neutral and factual.
- Use simple language.
- Base your summary only on the bill text provided.
- Do not speculate about motives, likely political effects, or consequences not stated in the text.
- If something is unclear, say so instead of guessing.
- Focus specifically on what the bill changes compared to existing law, not just what it says.
- Focus on what the bill changes, who it affects, and any money or date information.
- If the bill mostly makes technical, conforming, or renumbering changes, say that clearly.
- Do not include anything that is not supported by the bill text.
- If large portions of the text are unchanged existing law, summarize only the changes.
    `.trim(),
                    },
                    {
                        role: "user",
                        content: `
Please summarize this Utah bill for a general audience.

Return a valid JSON object with exactly these properties:
{
  "one_sentence_summary": string,
  "plain_english_overview": string,
  "key_changes": string[],
  "who_is_affected": string[],
  "money_or_funding_impact": string,
  "effective_date": string,
  "unclear_items": string
}

Instructions for each field:
- "one_sentence_summary": one short sentence saying what the bill mainly does
- "plain_english_overview": 1 to 2 short paragraphs in plain English
- "key_changes": 2 to 6 short bullet-style strings describing the main changes in the bill text
- "who_is_affected": list the people, agencies, industries, local governments, schools, courts, or other groups directly affected
- "money_or_funding_impact": describe any appropriation, tax change, fee change, transfer, fiscal mechanism, or say "Not clearly stated in the bill text."
- "effective_date": give the effective date exactly if stated, or say "Not clearly stated in the bill text."
- "unclear_items": briefly note anything important that is ambiguous, cross-referenced without explanation, or not clearly stated; if nothing stands out, say "Nothing significant is unclear from the bill text alone."

Important:
- Use only the bill text below.
- Do not use outside knowledge.
- Do not guess.
- If the bill amends existing law, describe the change in plain English rather than quoting legal language.
- If the bill has multiple parts, focus on the main operative changes.
- If the bill is mostly technical or administrative, say so plainly.
- If large portions of the text are unchanged existing law, summarize only the changes.

Bill metadata:
- Bill ID: ${bill.id}
- Year: ${bill.year}
- Session ID: ${bill.session_id}
- Short title: ${bill.short_title}

Bill text:
${bill.full_text}
    `.trim(),
                    },
                ],
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: "bill_summary",
                        strict: true,
                        schema: {
                            type: "object",
                            properties: {
                                one_sentence_summary: { type: "string" },
                                plain_english_overview: { type: "string" },
                                key_changes: {
                                    type: "array",
                                    items: { type: "string" },
                                },
                                who_is_affected: {
                                    type: "array",
                                    items: { type: "string" },
                                },
                                money_or_funding_impact: { type: "string" },
                                effective_date: { type: "string" },
                                unclear_items: { type: "string" },
                            },
                            required: [
                                "one_sentence_summary",
                                "plain_english_overview",
                                "key_changes",
                                "who_is_affected",
                                "money_or_funding_impact",
                                "effective_date",
                                "unclear_items",
                            ],
                            additionalProperties: false,
                        },
                    },
                },
            }),
        });
        if (response.ok) {
            const data = await response.json();
            const summary = data.choices[0].message.content;
            return summary;
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
