import { requireEnv } from "../env.js";

//the sessions the ETL fills, newest first - year is the first 4 characters ("2025S1" -> 2025)
export const SESSION_LIST = ["2026GS", "2025S2", "2025S1", "2025GS"];

export const API_BASE_URL = "https://glen.le.utah.gov";
export const WEB_BASE_URL = "https://le.utah.gov";

export const AI_BASE_URL = "https://nano-gpt.com/api/v1/chat/completions";
export const AI_MODEL = "deepseek/deepseek-v4-flash";

//the Utah Legislature API token (server_ts/.env)
export const legislatureApiToken = () =>
    requireEnv("LEGISLATURE_API_DEV_TOKEN");

//the nano-gpt token for the paid LLM stages (server_ts/.env). The JavaScript ETL hard-coded this in
//constants.js - it lives in .env now, and the old key should be rotated
export const aiToken = () => requireEnv("NANO_AI_TOKEN");

export const sessionYear = (sessionId: string) => Number(sessionId.slice(0, 4));
