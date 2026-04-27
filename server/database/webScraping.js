import * as cheerio from "cheerio";
import { VoteValue } from "../classes/vote.js";

const scrapeBillVote = async (sessionId, billId, voteUrl) => {
    try {
        if (!voteUrl) {
            return [];
        }
        const response = await fetch(voteUrl, { method: "GET" });
        const htmlData = await response.text();
        const $ = cheerio.load(htmlData);

        const votingTables = $("center table");
        const yesTable = votingTables[0];
        const noTable = votingTables[1];
        const absentTable = votingTables[2];

        //If the legislator is currently active, the vote will contain a link.
        //Using that link, you can get the legislators unique id.
        //If the legislator is retired, then there is no link and the legislator's name will be part of the font class
        const getLinksAndNames = (table) => {
            const legislatorVotes = $(table).find("td font");
            const linkAndNameObjects = Array.from(legislatorVotes).map(
                (element) => {
                    const link = $(element).find("a");
                    if (link.length > 0) {
                        const href = link.attr("href") || "";
                        const match = href.match(/'([^']+)'/);
                        const cleanedLink = match ? match[1] : "";
                        return {
                            link: cleanedLink,
                            name: link.text(),
                        };
                    } else {
                        return {
                            link: "",
                            name: $(element).text(),
                        };
                    }
                },
            );
            return linkAndNameObjects;
        };

        const yesVotes = getLinksAndNames(yesTable);
        const noVotes = getLinksAndNames(noTable);
        const absentVotes = getLinksAndNames(absentTable);

        const yesIds = getIds(yesVotes);
        const noIds = getIds(noVotes);
        const absentIds = getIds(absentVotes);

        const promiseResult = await Promise.all([yesIds, noIds, absentIds]);
        const yesIdsArray = promiseResult[0];
        const noIdsArray = promiseResult[1];
        const absentIdsArray = promiseResult[2];

        const house = new URL(voteUrl).searchParams.get("house");

        const yesVotesTotal = createVoteDatabaseObjects(
            sessionId,
            billId,
            yesVotes,
            yesIdsArray,
            VoteValue.yes,
        );
        const noVotesTotal = createVoteDatabaseObjects(
            sessionId,
            billId,
            noVotes,
            noIdsArray,
            VoteValue.no,
        );
        const absentVotesTotal = createVoteDatabaseObjects(
            sessionId,
            billId,
            absentVotes,
            absentIdsArray,
            VoteValue.absent,
        );

        const totalVotes = yesVotesTotal.concat(noVotesTotal, absentVotesTotal);
        return totalVotes;
    } catch (err) {
        console.log(err.message);
    }
};

const createVoteDatabaseObjects = (
    sessionId,
    billId,
    legislatorVoteArray,
    idArray,
    vote,
) => {
    try {
        const voteArray = [];
        if (legislatorVoteArray.length !== idArray.length) {
            console.log("Error with voter array and legislator id arrary");
            return [];
        }
        for (let i = 0; i < legislatorVoteArray.length; i++) {
            voteArray.push({
                sessionId: sessionId,
                billId: billId,
                legislatorId: idArray[i],
                vote: vote,
            });
        }
        return voteArray;
    } catch (err) {
        console.log(err.message);
    }
};

const getIds = async (arr) => {
    try {
        const results = await Promise.all(
            arr.map(async (vote) => {
                if (vote.link === "") {
                    return "";
                }

                const baseUrl = "https://le.utah.gov";
                try {
                    const newUrl = baseUrl + vote.link;
                    const response = await fetch(newUrl, { method: "GET" });
                    const idUrl = response.url;
                    const id = idUrl
                        ?.split("/")
                        ?.filter(
                            (item) => item !== "" && item !== "le.utah.gov",
                        )
                        ?.pop();
                    return id;
                } catch (err) {
                    //we do not allow for null values in the legislator id column in the database, so
                    //use a -1 value instead
                    console.log(`error for ${vote.link}, ${err.message}`);
                    return "-1";
                }
            }),
        );

        return results;
    } catch (err) {
        console.log(err);
        return [];
    }
};

function parse(node, cheerio) {
    let out = "";

    cheerio(node)
        .contents()
        .each((_, el) => {
            if (el.type === "text") {
                out += el.data;
                return;
            }

            const tag = el.name;

            switch (tag) {
                // Line breaks
                case "br":
                    out += "\n";
                    break;

                // Paragraph-like blocks
                case "gd":
                case "hp":
                case "moni":
                case "oc":
                case "ua":
                case "sectiontext":
                    out += "\n\n" + parse(el);
                    break;

                // Headers
                case "lthead":
                case "gdhead":
                case "hphead":
                case "sessionhead":
                case "statehead":
                case "sponsorhead":
                    out += "\n\n" + parse(el).toUpperCase() + "\n";
                    break;

                // Bullet items
                case "hl":
                    out += "\n▸ " + parse(el);
                    break;

                // Numbered sections
                case "display":
                    out += " " + parse(el) + " ";
                    break;

                // Sections
                case "section":
                case "bsec":
                    out += "\n\n" + parse(el);
                    break;

                // Subsections (indentation)
                case "subsection":
                    out += "\n" + parse(el);
                    break;

                // Amounts (keep them)
                case "ltamt":
                    out += parse(el);
                    break;

                // Cross references
                case "xref":
                    out += parse(el);
                    break;

                // Amendments
                case "amend":
                    if (el.attribs?.ea === "amend") {
                        // keep new text
                        out += parse(el);
                    }
                    // ignore deleted text
                    break;

                // Ignore deleted sections
                case "amendoutstart":
                case "amendoutend":
                    break;

                // Ignore line numbers
                case "div":
                    if (el.attribs?.class === "lineno") break;
                    out += parse(el);
                    break;

                default:
                    out += parse(el);
            }
        });

    return out;
}

async function parseUtahBill(year, billId) {
    const htmlUrl = `https://le.utah.gov/~${year}/bills/static/${billId}.html`;

    const xmlUrl = `https://le.utah.gov/Session/${year}/bills/enrolled/${billId}.xml`;

    const responseHTML = await fetch(htmlUrl, { method: "GET" });

    const responseXML = await fetch(xmlUrl, { method: "GET" });

    const html = await responseHTML.text();
    const xml = await responseXML.text();

    const $ = cheerio.load(xml, { xmlMode: true });

    function walk(node) {
        let out = "";

        $(node)
            .contents()
            .each((_, el) => {
                if (el.type === "text") {
                    out += el.data;
                    return;
                }

                const tag = el.name;

                switch (tag) {
                    case "br":
                        out += "\n";
                        break;

                    // Paragraph-like blocks
                    case "gd":
                    case "hp":
                    case "moni":
                    case "oc":
                    case "ua":
                    case "sectiontext":
                        out += "\n\n" + walk(el);
                        break;

                    // Headers
                    case "lthead":
                    case "gdhead":
                    case "hphead":
                    case "sessionhead":
                    case "statehead":
                    case "sponsorhead":
                        out += "\n\n" + walk(el).toUpperCase() + "\n";
                        break;

                    // Bullet items
                    case "hl":
                        out += "\n▸ " + walk(el);
                        break;

                    // Number labels like (1), (a)
                    case "display":
                        out += " " + walk(el) + " ";
                        break;

                    // Sections
                    case "section":
                    case "bsec":
                        out += "\n\n" + walk(el);
                        break;

                    // Subsections
                    case "subsection":
                        out += "\n" + walk(el);
                        break;

                    // Keep amounts
                    case "ltamt":
                        out += walk(el);
                        break;

                    // Cross references
                    case "xref":
                        out += walk(el);
                        break;

                    // Amendments: keep new text only
                    case "amend":
                        if (el.attribs?.ea === "amend") {
                            out += walk(el);
                        }
                        break;

                    // Ignore deleted content wrappers
                    case "amendoutstart":
                    case "amendoutend":
                        break;

                    // Remove line numbers
                    case "div":
                        if (el.attribs?.class === "lineno") break;
                        out += walk(el);
                        break;

                    default:
                        out += walk(el);
                }
            });

        return out;
    }

    const before = walk($.root());

    return walk($.root())
        .replace(/\u00a0/g, " ")
        .replace(/[ \t]+/g, " ")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]+$/gm, "")
        .trim();
}

const scrapeBillText = async (year, billId, billUrl) => {
    try {
        const bodyText = await parseUtahBill(year, billId);
        // const htmlUrl = `https://le.utah.gov/~${year}/bills/static/${billId}.html`;

        // const xmlUrl = `https://le.utah.gov/Session/${year}/bills/enrolled/${billId}.xml`;

        // const responseHTML = await fetch(htmlUrl, { method: "GET" });

        // const responseXML = await fetch(xmlUrl, { method: "GET" });

        // // if (!response.ok) {
        // //     throw new Error(`Failed to fetch XML: ${response.status}`);
        // // }

        // const htmlData = await responseHTML.text();
        // const xmlData = await responseXML.text();
        // const $ = cheerio.load(xmlData, {
        //     xmlMode: true,
        //     decodeEntities: true, // 👈 better for readable output
        // });

        // const result = parse("body", $)
        //     .replace(/[ \t]+\n/g, "\n")
        //     .replace(/\n{3,}/g, "\n\n")
        //     .trim();
        // console.log(result);
        // return result;
        // $(".lineno").replaceWith("\n");
        // $("ln").replaceWith("\n");
        // $("span.bullet").replaceWith("\n• ");

        // let moneyAppropriated = $("moni").text();

        // // Clean WITHOUT breaking formatting
        // moneyAppropriated = moneyAppropriated
        //     .replace(/[ \t]+/g, " ") // collapse spaces/tabs ONLY
        //     .replace(/\n[ \t]+/g, "\n") // remove spaces after newlines
        //     .replace(/\n{2,}/g, "\n") // collapse multiple newlines
        //     .trim();

        // //console.log(moneyAppropriated);

        // const sections = $("bsec section")
        //     .map((_, el) => $(el).text().replace(/\s+/g, " ").trim())
        //     .get();

        // const bodyText = sections.join("\n\n");

        return {
            full_text: bodyText,
        };
    } catch (e) {
        console.log(e);

        return {
            full_text: "",
            money_appropriated: "",
        };
    }
};

export { scrapeBillVote, scrapeBillText };
