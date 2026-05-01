import * as cheerio from "cheerio";

import { DEV_TOKEN, WEB_BASE_URL } from "./constants.js";

export const getUtahBillText = async (year, billId, sessionSuffix = null) => {
    try {
        //get printer friendly pdf url
        const pdfUrl = await createPdfLink(year, billId);

        //get version of bill, which is needed for xml url
        const version = await getVersionFromPdfFile(pdfUrl); //either enrolled or introduced

        //get full text of bill - this will not be used for formatting, it will be used to generate ai summaries
        const xmlCleanedText = await getXmlText(year, billId, version);

        return {
            pdfUrl: pdfUrl,
            fullText: xmlCleanedText,
        };
    } catch (e) {
        console.log(`get bill text ${billId} ${e.message}`);
    }
};

async function urlExists(url) {
    const response = await fetch(url);
    return response.ok;
}

async function createPdfLink(year, billId) {
    const enrolledUrl = `${WEB_BASE_URL}/Session/${year}/bills/enrolled/${billId}.pdf`;
    let exists = await urlExists(enrolledUrl);
    if (exists) {
        return enrolledUrl;
    }

    const introducedUrl = `${WEB_BASE_URL}/Session/${year}/bills/introduced/${billId}.pdf`;
    return introducedUrl;
}

async function getVersionFromPdfFile(pdfUrl) {
    const lowerUrl = pdfUrl.toLowerCase();

    if (lowerUrl.includes("/enrolled/")) {
        return "enrolled";
    }
    //just get the introduced version of the bill even if there are substitutes,
    //there is no easy way to get a substitue url, but every bill should have an introduced one.
    else {
        return "introduced";
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, tries = 3) {
    for (let attempt = 1; attempt <= tries; attempt++) {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0",
            },
        });

        if (response.ok) {
            return response;
        }

        if (response.status !== 503 || attempt === tries) {
            return response;
        }

        console.log(`503 for ${url}, retry ${attempt}`);
        await sleep(attempt * 2000);
    }
}

async function getXmlText(year, billId, version) {
    const xmlUrl = `${WEB_BASE_URL}/Session/${year}/bills/${version}/${billId}.xml`;

    const response = await fetchWithRetry(xmlUrl, 4);

    if (!response.ok) {
        console.log(`xml response bad ${response.status} ${xmlUrl}`);
        return null;
    }

    const xml = await response.text();

    if (!xml || !xml.trim()) {
        return null;
    }

    const rawText = xml;

    const extractedText = extractXmlText(rawText);
    const cleanedText = cleanText(extractedText);

    return cleanedText;
}

function extractXmlText(xml) {
    const $ = cheerio.load(xml, { xmlMode: true });

    function isGarbageText(text) {
        const value = String(text || "").trim();

        if (!value) return false;
        if (/^[\d-]+$/.test(value)) return true;
        if (/^\d+(?:-\d+)+$/.test(value)) return true;

        return false;
    }

    function walk(node) {
        let out = "";

        $(node)
            .contents()
            .each((_, el) => {
                if (el.type === "text") {
                    const text = el.data || "";

                    if (!isGarbageText(text)) {
                        out += text;
                    }

                    return;
                }

                const tag = el.name;

                switch (tag) {
                    case "br":
                        out += "\n";
                        break;

                    case "gd":
                    case "hp":
                    case "moni":
                    case "oc":
                    case "ua":
                    case "sectiontext":
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

                    case "section":
                    case "bsec":
                        out += "\n\n" + walk(el);
                        break;

                    case "subsection":
                        out += "\n" + walk(el);
                        break;

                    case "ltamt":
                    case "xref":
                        out += walk(el);
                        break;

                    case "amend":
                        if (el.attribs?.ea === "amend") {
                            out += walk(el);
                        }
                        break;

                    case "amendoutstart":
                    case "amendoutend":
                        break;

                    case "div":
                        if (el.attribs?.class === "lineno") break;
                        out += walk(el);
                        break;

                    default:
                        out += walk(el);
                        break;
                }
            });

        return out;
    }

    const legRoot = $("leg").first();

    if (!legRoot.length) {
        return cleanText(walk($.root()));
    }

    return cleanText(walk(legRoot))
        .replace(/^[\d-]{6,}(?=[A-Z])/, "")
        .trim();
}

function cleanText(text) {
    return text
        .replace(/\u00a0/g, " ")
        .replace(/\r/g, "")
        .replace(/[ \t]+/g, " ")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]+$/gm, "")
        .trim();
}
