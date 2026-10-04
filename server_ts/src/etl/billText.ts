import * as cheerio from "cheerio";
import type { AnyNode, Element } from "domhandler";
import { WEB_BASE_URL } from "./config.js";

//a bill's printer-friendly PDF link and its full text (from the bill's XML), scraped from le.utah.gov - the
//full text feeds the AI summaries. Ported from the JavaScript ETL's getBillTextFromWebScraping.js

export type BillText = { pdfUrl: string; fullText: string | null };

//pathYear is the year for regular sessions ("2026") or the session code for special sessions ("2025S1"),
//which is how le.utah.gov names its folders. null (logged) when the scrape fails
export async function getBillText(
    pathYear: string,
    billNumber: string,
): Promise<BillText | null> {
    try {
        const pdfUrl = await pdfLink(pathYear, billNumber);
        //the enrolled version once a bill passes, otherwise the introduced one - substitutes have no
        //predictable URL, but every bill has an introduced version
        const version = pdfUrl.toLowerCase().includes("/enrolled/")
            ? "enrolled"
            : "introduced";
        const fullText = await xmlText(pathYear, billNumber, version);
        return { pdfUrl, fullText };
    } catch (err) {
        console.log(`bill text ${billNumber}: ${(err as Error).message}`);
        return null;
    }
}

//special sessions live under their session code, ie /Session/2025S1/...
export const billTextPathYear = (sessionCode: string) =>
    /S0?\d+$/i.test(sessionCode) ? sessionCode : sessionCode.slice(0, 4);

async function pdfLink(pathYear: string, billNumber: string) {
    const enrolled = `${WEB_BASE_URL}/Session/${pathYear}/bills/enrolled/${billNumber}.pdf`;
    const response = await fetch(enrolled);
    return response.ok
        ? enrolled
        : `${WEB_BASE_URL}/Session/${pathYear}/bills/introduced/${billNumber}.pdf`;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

//le.utah.gov sometimes answers 503 under load - retry those with a growing pause
async function fetchWithRetry(url: string, tries = 3): Promise<Response> {
    for (let attempt = 1; ; attempt++) {
        const response = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0" },
        });
        if (response.ok || response.status !== 503 || attempt === tries) {
            return response;
        }
        console.log(`503 for ${url}, retry ${attempt}`);
        await sleep(attempt * 2000);
    }
}

async function xmlText(pathYear: string, billNumber: string, version: string) {
    const url = `${WEB_BASE_URL}/Session/${pathYear}/bills/${version}/${billNumber}.xml`;
    const response = await fetchWithRetry(url, 4);
    if (!response.ok) {
        console.log(`xml response bad ${response.status} ${url}`);
        return null;
    }
    const xml = await response.text();
    return xml.trim() ? cleanText(extractXmlText(xml)) : null;
}

//line numbers and section numbers ("53F-2-301") that the XML mixes into the text
const isGarbageText = (text: string) => {
    const value = text.trim();
    return value !== "" && /^[\d-]+$/.test(value);
};

//walks the bill XML into readable text - headings upper-cased on their own lines, highlighted provisions as
//bullets, amendments kept only where they add text, and line numbers dropped
export function extractXmlText(xml: string): string {
    const $ = cheerio.load(xml, { xml: true });

    const walk = (node: AnyNode): string => {
        let out = "";
        $(node)
            .contents()
            .each((_, child) => {
                if (child.type === "text") {
                    const text = child.data ?? "";
                    if (!isGarbageText(text)) out += text;
                    return;
                }
                if (child.type !== "tag") return;

                const el = child as Element;
                switch (el.name) {
                    case "br":
                        out += "\n";
                        break;
                    case "gd":
                    case "hp":
                    case "moni":
                    case "oc":
                    case "ua":
                    case "sectiontext":
                    case "section":
                    case "bsec":
                        out += "\n\n" + walk(el);
                        break;
                    case "lthead":
                    case "gdhead":
                    case "hphead":
                    case "sessionhead":
                    case "statehead":
                    case "sponsorhead":
                        out += "\n\n" + walk(el).toUpperCase() + "\n";
                        break;
                    case "hl":
                        out += "\n• " + walk(el);
                        break;
                    case "display":
                        out += " " + walk(el) + " ";
                        break;
                    case "subsection":
                        out += "\n" + walk(el);
                        break;
                    case "amend":
                        if (el.attribs?.ea === "amend") out += walk(el);
                        break;
                    case "amendoutstart":
                    case "amendoutend":
                        break;
                    case "div":
                        if (el.attribs?.class !== "lineno") out += walk(el);
                        break;
                    default:
                        //ltamt, xref, and any other tag - just its text
                        out += walk(el);
                        break;
                }
            });
        return out;
    };

    const legRoot = $("leg").first();
    if (!legRoot.length) return cleanText(walk($.root()[0]));
    return cleanText(walk(legRoot[0]))
        .replace(/^[\d-]{6,}(?=[A-Z])/, "")
        .trim();
}

function cleanText(text: string): string {
    return text
        .replace(/ /g, " ")
        .replace(/\r/g, "")
        .replace(/[ \t]+/g, " ")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]+$/gm, "")
        .trim();
}
