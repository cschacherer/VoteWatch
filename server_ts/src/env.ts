import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

//server_ts/.env holds DATABASE_URL (the API and the ETL), plus LEGISLATURE_API_DEV_TOKEN and NANO_AI_TOKEN
//(only the ETL) - loaded once, by whichever module imports this first
process.loadEnvFile(path.join(__dirname, "../.env"));

//a required setting - read when it's needed, so the API server doesn't need the ETL-only tokens.
//The error names the setting but never its value
export function requireEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`${name} is not set - add it to server_ts/.env`);
    }
    return value;
}
