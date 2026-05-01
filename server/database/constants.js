import dotenv from "dotenv";
dotenv.config();

export const SESSION_LIST = ["2026GS", "2025S2", "2025S1", "2025GS"];

export const DEV_TOKEN = process.env.LEGISLATURE_API_DEV_TOKEN;
export const API_BASE_URL = "https://glen.le.utah.gov";
export const WEB_BASE_URL = "https://le.utah.gov";
