import { API_BASE_URL, legislatureApiToken } from "./config.js";

//the Utah Legislature API (glen.le.utah.gov) - its JSON varies between years (key spelling and casing),
//so responses come back loosely typed and parse.ts normalizes them
export type ApiRecord = Record<string, unknown>;

//GETs one API path with the token appended - null (logged) when the request fails, like the JavaScript ETL,
//so one bad bill doesn't stop a whole session. The token is never logged
async function getJson<T>(pathBeforeToken: string): Promise<T | null> {
    try {
        const response = await fetch(
            `${API_BASE_URL}${pathBeforeToken}/${legislatureApiToken()}`,
        );
        if (response.ok) return (await response.json()) as T;
        console.log(`API ${pathBeforeToken} -> ${response.status}`);
    } catch (err) {
        console.log(`API ${pathBeforeToken} failed: ${(err as Error).message}`);
    }
    return null;
}

//every current legislator
export async function getAllLegislators(): Promise<ApiRecord[]> {
    const result = await getJson<{ legislators?: ApiRecord[] }>("/legislators");
    return result?.legislators ?? [];
}

//the bills in a session - only a list of numbers, getBill has the details
export async function getBillList(sessionId: string): Promise<ApiRecord[]> {
    const result = await getJson<ApiRecord[]>(`/bills/${sessionId}/billlist`);
    return Array.isArray(result) ? result : [];
}

//one bill's full details
export function getBill(sessionId: string, billNumber: string) {
    return getJson<ApiRecord>(`/bills/${sessionId}/${billNumber}`);
}

//the bills that passed in a session - each has number (possibly with a version suffix, ie HB0005S01),
//datepassed, and effectivedate
export async function getPassedBills(sessionId: string): Promise<ApiRecord[]> {
    const result = await getJson<{ passedbills?: ApiRecord[] }>(
        `/bills/${sessionId}/passedlist`,
    );
    return result?.passedbills ?? [];
}
