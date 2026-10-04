import { AI_BASE_URL, AI_MODEL, aiToken } from "../config.js";

//one chat completion from nano-gpt (an OpenAI-compatible API) with a strict JSON schema for the answer -
//shared by the summary and policy stages. These calls cost money, so only the --paid stages make them

export type ChatMessage = { role: "system" | "user"; content: string };

//the answer's JSON text, or null (logged) when the request fails - the token is never logged
export async function chatCompletionJson(
    messages: ChatMessage[],
    schemaName: string,
    schema: object,
): Promise<string | null> {
    try {
        const response = await fetch(AI_BASE_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${aiToken()}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: AI_MODEL,
                messages,
                response_format: {
                    type: "json_schema",
                    json_schema: { name: schemaName, strict: true, schema },
                },
            }),
        });
        if (!response.ok) {
            console.log(
                `LLM ${schemaName}: ${response.status} ${response.statusText}`,
            );
            return null;
        }
        const data = (await response.json()) as {
            choices?: { message?: { content?: string } }[];
        };
        return data.choices?.[0]?.message?.content ?? null;
    } catch (err) {
        console.log(`LLM ${schemaName} failed: ${(err as Error).message}`);
        return null;
    }
}

//what the prompts know about a bill
export type AiBill = {
    bill_number: string;
    year: string;
    session_code: string;
    short_title: string | null;
    full_text: string | null;
    subjects: string | null;
    summary_text: string | null;
};
