import type { ApiRecord } from "./govApi.js";
import { sessionYear } from "./config.js";

//the API's JSON changes between years (2024-2026): keys differ in casing and spelling, so top-level keys are
//lower-cased first and each field checks its known spellings - ported from the JavaScript ETL's Bill and
//Legislator classes (server/classes)

const lowerCaseKeys = (record: ApiRecord): ApiRecord =>
    Object.fromEntries(
        Object.entries(record).map(([key, value]) => [
            key.toLowerCase(),
            value,
        ]),
    );

//the first of the keys that holds a non-empty value, as a string
const pick = (record: ApiRecord, ...keys: string[]): string | null => {
    for (const key of keys) {
        const value = record[key];
        if (value !== undefined && value !== null && value !== "") {
            return String(value);
        }
    }
    return null;
};

export type ParsedLegislator = {
    code: string;
    full_name: string;
    format_name: string;
    image: string;
    house: string;
    party: string;
    district: number | null;
    counties: string;
    email: string;
    phone: string;
    service_start: string;
    link: string;
};

export function parseLegislator(raw: ApiRecord): ParsedLegislator | null {
    const legislator = lowerCaseKeys(raw);
    const code = pick(legislator, "id");
    const fullName = pick(legislator, "full_name", "fullname");
    if (!code || !fullName) return null;

    const house = pick(legislator, "house") ?? "";
    const district = Number(pick(legislator, "district"));
    return {
        code,
        full_name: fullName,
        format_name: pick(legislator, "format_name", "formatname") ?? "",
        image: pick(legislator, "image") ?? "",
        house,
        party: pick(legislator, "party") ?? "",
        district: Number.isFinite(district) && district > 0 ? district : null,
        counties: pick(legislator, "counties") ?? "",
        email: pick(legislator, "email") ?? "",
        phone: pick(legislator, "cell") ?? "",
        service_start: pick(legislator, "service_start", "servicestart") ?? "",
        link:
            house === "H"
                ? `https://house.utleg.gov/rep/${code}`
                : `https://senate.utah.gov/sen/${code}`,
    };
}

//the bill fields that come from the API - full text, summaries, and policies are filled by later stages
export type ParsedBill = {
    session_code: string;
    bill_number: string;
    short_title: string | null;
    general_provisions: string | null;
    highlighted_provisions: string | null;
    money_appropriated: string;
    last_action: string;
    last_action_date: string;
    subjects: string;
    sponsor_code: string | null;
    floor_sponsor_code: string | null;
    tracking_id: string;
    house_vote_url: string;
    senate_vote_url: string;
    link: string;
};

export function parseBill(
    raw: ApiRecord,
    sessionId: string,
): ParsedBill | null {
    const bill = lowerCaseKeys(raw);
    const billNumber = pick(bill, "id", "billnumber", "bill");
    const sessionCode = pick(bill, "session_id", "sessionid") ?? sessionId;
    if (!billNumber || !sessionCode) return null;

    const actionHistory = (bill.actionhistorylist ??
        bill.actionhistory ??
        []) as ApiRecord[];
    const year = pick(bill, "year") ?? String(sessionYear(sessionCode));

    return {
        session_code: sessionCode,
        bill_number: billNumber,
        short_title: pick(bill, "short_title", "shorttitle"),
        general_provisions: pick(
            bill,
            "general_provisions",
            "generalprovisions",
        ),
        highlighted_provisions: pick(
            bill,
            "highlighted_provisions",
            "highlightedprovisions",
            "hilightedprovisions",
        ),
        money_appropriated:
            pick(bill, "money_appropriated", "moniesappropriated", "monies") ??
            "",
        last_action: pick(bill, "last_action", "lastaction") ?? "",
        last_action_date:
            pick(bill, "last_action_date", "lastactiondate") ?? "",
        subjects:
            pick(bill, "subjects") ??
            activeVersionSubjects(bill.billversionlist) ??
            "",
        sponsor_code: pick(bill, "bill_sponsor", "primesponsor", "sponsor"),
        floor_sponsor_code: pick(bill, "floor_sponsor", "floorsponsor"),
        tracking_id: pick(bill, "tracking_id", "trackingid") ?? "",
        house_vote_url:
            pick(bill, "house_vote_url") ??
            thirdReadingVoteUrl(actionHistory, sessionCode, "house") ??
            "",
        senate_vote_url:
            pick(bill, "senate_vote_url") ??
            thirdReadingVoteUrl(actionHistory, sessionCode, "senate") ??
            "",
        link: `https://le.utah.gov/~${year}/bills/static/${billNumber}.html`,
    };
}

//the subject list of the bill's active version, ie "Education, K-12 Education"
function activeVersionSubjects(billVersionList: unknown): string | null {
    if (!Array.isArray(billVersionList)) return null;
    const active = (billVersionList as ApiRecord[]).find(
        (version) => version.activeVersion === true,
    );
    const subjects = active?.subjectList;
    if (!Array.isArray(subjects)) return null;
    return (subjects as ApiRecord[])
        .map((s) => String(s.description))
        .join(", ");
}

//the roll-call vote page for the bill passing 3rd reading in one chamber - first an exact "passed 3rd
//reading" match, then a looser "passed" + "3rd reading" one. null when the bill never got that far
function thirdReadingVoteUrl(
    actionHistory: ApiRecord[],
    sessionId: string,
    chamber: "house" | "senate",
): string | null {
    if (!Array.isArray(actionHistory)) return null;
    //description when it has text, otherwise action (some years use one, some the other)
    const text = (action: ApiRecord) =>
        String(action.description || action.action || "").toLowerCase();
    const inChamber = (action: ApiRecord) =>
        text(action).includes(`${chamber}/`);

    const action =
        actionHistory.find(
            (a) => inChamber(a) && text(a).includes("passed 3rd reading"),
        ) ??
        actionHistory.find(
            (a) =>
                inChamber(a) &&
                text(a).includes("passed") &&
                text(a).includes("3rd reading"),
        );

    const voteId = action?.voteID;
    if (!voteId) return null;
    const house = chamber === "house" ? "H" : "S";
    return `https://le.utah.gov/DynaBill/svotes.jsp?sessionid=${sessionId}&voteid=${voteId}&house=${house}`;
}

//a passed-list bill number without its version suffix - HB0005S01 -> HB0005
export const baseBillNumber = (billNumber: string) =>
    billNumber.toUpperCase().trim().replace(/S\d+$/, "");
