import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { Agent } from "undici";
import type { VoteValue } from "../types.js";
import { WEB_BASE_URL } from "./config.js";

//a bill's roll-call votes in one chamber, scraped from le.utah.gov's svotes.jsp page - ported from the
//JavaScript ETL's getVotesFromWebScraping.js

//le.utah.gov's vote pages fail Node's TLS certificate check, so these requests skip it (as the JavaScript ETL
//did). Only used for le.utah.gov's public vote pages, which carry no credentials
const insecureDispatcher = new Agent({
    connect: { rejectUnauthorized: false },
});

export type ScrapedVote = { legislator_code: string; vote: VoteValue };

//finds the legislator code for a chamber + district - used when a vote link doesn't redirect to a bio
export type DistrictLookup = (
    chamber: string,
    district: string,
) => Promise<string | null>;

export type ScrapedBillVotes = {
    votes: ScrapedVote[];
    //voters with no link (retired legislators) or whose link couldn't be resolved - skipped
    unresolved: number;
};

export async function scrapeBillVotes(
    voteUrl: string,
    lookupByDistrict: DistrictLookup,
): Promise<ScrapedBillVotes | null> {
    try {
        const response = await fetch(voteUrl, {
            dispatcher: insecureDispatcher,
        } as RequestInit);
        if (!response.ok) {
            console.log(`vote page ${response.status}: ${voteUrl}`);
            return null;
        }
        const $ = cheerio.load(await response.text());

        //the page has three tables: yes, no, absent
        const [yesTable, noTable, absentTable] = $("center table").toArray();
        const tables: [AnyNode | undefined, VoteValue][] = [
            [yesTable, "yes"],
            [noTable, "no"],
            [absentTable, "absent"],
        ];

        const result: ScrapedBillVotes = { votes: [], unresolved: 0 };
        for (const [table, vote] of tables) {
            if (!table) continue;
            //a current legislator's name links to their page (the link holds their id); a retired
            //legislator's name is plain text with no link
            const links = $(table)
                .find("td font")
                .toArray()
                .map((font) => {
                    const href = $(font).find("a").attr("href") ?? "";
                    return href.match(/'([^']+)'/)?.[1] ?? "";
                });

            const codes = await Promise.all(
                links.map((link) =>
                    link
                        ? legislatorCodeFromLink(link, lookupByDistrict)
                        : null,
                ),
            );
            for (const code of codes) {
                if (code) result.votes.push({ legislator_code: code, vote });
                else result.unresolved++;
            }
        }
        return result;
    } catch (err) {
        console.log(`vote page failed ${voteUrl}: ${(err as Error).message}`);
        return null;
    }
}

//a vote link redirects to the legislator's bio, whose last path segment is their code - when it doesn't
//redirect, the link's house and dist parameters find them by district instead
async function legislatorCodeFromLink(
    link: string,
    lookupByDistrict: DistrictLookup,
): Promise<string | null> {
    const url = WEB_BASE_URL + link;
    try {
        const response = await fetch(url, {
            dispatcher: insecureDispatcher,
            redirect: "manual",
        } as RequestInit);
        const location = response.headers.get("location");

        if (location) {
            return (
                new URL(location, WEB_BASE_URL).pathname
                    .split("/")
                    .filter(Boolean)
                    .pop() ?? null
            );
        }

        const params = new URL(url).searchParams;
        const chamber = params.get("house");
        const district = params.get("dist");
        return chamber && district ? lookupByDistrict(chamber, district) : null;
    } catch (err) {
        console.log(
            `legislator link failed ${link}: ${(err as Error).message}`,
        );
        return null;
    }
}
