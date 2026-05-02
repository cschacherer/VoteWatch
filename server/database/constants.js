import dotenv from "dotenv";
dotenv.config();

export const SESSION_LIST = ["2026GS", "2025S2", "2025S1", "2025GS"];

//export const SESSION_LIST = ["2025S2"];

export const DEV_TOKEN = process.env.LEGISLATURE_API_DEV_TOKEN;
export const API_BASE_URL = "https://glen.le.utah.gov";
export const WEB_BASE_URL = "https://le.utah.gov";

//export const AI_TOKEN = process.env.NANO_AI_TOKEN;
export const AI_TOKEN = "sk-nano-a4785eb4-83af-49a7-9a5b-adbafc4908f3";
export const AI_BASE_URL = "https://nano-gpt.com/api/v1/chat/completions";
export const AI_MODEL = "deepseek/deepseek-v4-flash";
