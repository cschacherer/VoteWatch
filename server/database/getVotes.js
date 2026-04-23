import * as cheerio from "cheerio";
import { VoteValue } from "../classes/vote.js";
import https from "https";
import { Agent } from "undici";
import Database from "./database.js";

const dispatcher = new Agent({
    connect: {
        rejectUnauthorized: false,
    },
});

export const scrapeBillVote = async (
    sessionId,
    billId,
    voteUrl,
    databaseObject,
) => {
    try {
        if (!voteUrl) {
            return [];
        }

        const response = await fetch(voteUrl, { method: "GET", dispatcher });
        if (!response.ok) {
            console.log(`error with fetch: ${sessionId} ${billId} ${voteUrl}`);
            return;
        }
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

        const yesIds = getIds(yesVotes, databaseObject);
        const noIds = getIds(noVotes, databaseObject);
        const absentIds = getIds(absentVotes, databaseObject);

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
            if (idArray[i] != "") {
                voteArray.push({
                    sessionId: sessionId,
                    billId: billId,
                    legislatorId: idArray[i],
                    vote: vote,
                });
            }
        }
        return voteArray;
    } catch (err) {
        console.log(err.message);
    }
};

const getIds = async (arr, databaseObject) => {
    try {
        const results = await Promise.all(
            arr.map(async (vote) => {
                if (vote.link === "") {
                    return "";
                }

                const baseUrl = "https://le.utah.gov";
                try {
                    const newUrl = baseUrl + vote.link;
                    const response = await fetch(newUrl, {
                        dispatcher,
                        redirect: "manual",
                    });

                    //the urls should redirect to the legislators govenerment bio, but sometimes it doesn't
                    let finalUrl = response.headers.get("location");

                    //if it doesn't redirect, find the legislator by district
                    if (finalUrl == null) {
                        const urlObj = new URL(newUrl);

                        const chamber = urlObj.searchParams.get("house");
                        const district = urlObj.searchParams.get("dist");

                        if (chamber && district) {
                            const legislator =
                                await databaseObject.getLegislatorFromDistrict(
                                    chamber,
                                    district,
                                );
                            return legislator.id;
                        }
                    } else {
                        const urlObj = new URL(finalUrl, baseUrl);

                        const lastSegment = urlObj.pathname
                            .split("/")
                            .filter(Boolean)
                            .pop();

                        if (lastSegment == "" || lastSegment == null) {
                            x = 0;
                        }

                        return lastSegment;
                    }

                    // if (finalUrl) {
                    //     const html = await response.text();

                    //     // look for redirect in HTML
                    //     const match = html.match(/url=([^"']+)/i);
                    //     if (match) {
                    //         finalUrl = match[1];
                    //     }
                    // }

                    //return finalUrl;
                    // const response = await fetch(newUrl, {
                    //     method: "GET",
                    //     dispatcher,
                    // });
                    // const idUrl = response.url;
                    // const id = idUrl
                    //     ?.split("/")
                    //     ?.filter(
                    //         (item) => item !== "" && item !== "le.utah.gov",
                    //     )
                    //     ?.pop();
                    // return id;
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

// let db = new Database();
// await db.openDatabase();
// const result = await scrapeBillVote(
//     "2026GS",
//     "HB001",
//     "https://le.utah.gov/DynaBill/svotes.jsp?sessionid=2026GS&voteid=81&house=H",
//     db,
// );
// console.log(result);
