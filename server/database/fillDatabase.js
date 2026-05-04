import Database from "./database.js";
import Bill from "../classes/bill.js";
import Legislator from "../classes/legislator.js";
import {
    getAllBillsBySessionFromGovApi,
    getBillFromGovApi,
    getPassedBillsFromGovApi,
} from "./getBillsFromGovApi.js";
import { getAllLegislatorsFromGovApi } from "./getLegislatorsFromGovApi.js";
import { scrapeBillVote } from "./getVotesFromWebScraping.js";
import { SESSION_LIST } from "./constants.js";
import { getUtahBillText } from "./getBillTextFromWebScraping.js";
import { getBillSummary } from "./getSummariesFromAI.js";
import { writeFileSync } from "fs";
import { getPolicyClassificationsForBills } from "./getPoliciesFromAI.js";

//let databaseName = './server/database/voteWatch.db';
const db = new Database();

// #region CREATE/DELETE ENTIRE DATABASE

const createNewEmptyDatabase = async () => {
    await db.createNewDatabase();
};

// #endregion

// #region LEGISLATURES TABLE

//this function will get the current legislatures from the utah gov api and then write it to the database.
const fillLegislatorsTable = async () => {
    await db.openDatabase();
    const currentLegislators = await getLegislatorsDataFromApi();
    const result = await writeLegislatorsToDatabase(currentLegislators);
};

const getLegislatorsDataFromApi = async () => {
    try {
        const allLegislatorsJson = await getAllLegislatorsFromGovApi();

        const allLegislators = allLegislatorsJson?.map(
            (leg) => new Legislator(leg),
        );

        return allLegislators;
    } catch (err) {
        console.log(`Error getting legislator data from api. ${err.stack}`);
        return false;
    }
};

const writeLegislatorsToDatabase = async (allLegislators) => {
    try {
        await Promise.all(
            allLegislators.map(async (legislator) => {
                await db.addToLegislators(legislator);
            }),
        );

        return true;
    } catch (err) {
        console.log(`Error filling legislator table. ${err.stack}`);
        return false;
    }
};

// #end region

// #region BILLS TABLE

const fillBillsTableAllSessions_generalData = async () => {
    await db.openDatabase();
    for (const session of SESSION_LIST) {
        try {
            console.log("starting session id: " + session);
            const sessionBills = await getAllBillsBySessionFromApi(session);
            await writeBillsToDatabase(sessionBills);
            console.log("finished session id: " + session);
        } catch (e) {
            console.log("error - ", e.message);
        }
    }
};

const fillBillsTableAllSessions_passedData = async () => {
    await db.openDatabase();
    for (const session of SESSION_LIST) {
        try {
            console.log("starting session id: " + session);
            await getAndWritePassedBillsToDatabase(session);
            console.log("finished session id: " + session);
        } catch (e) {
            console.log("error - ", e.message);
        }
    }
};

const fillBillsTableAllSessions_textData = async () => {
    await db.openDatabase();
    for (const session of SESSION_LIST) {
        try {
            console.log("starting session id: " + session);
            await getAndWriteFullBillTextToDatabase(session);
            console.log("finished session id: " + session);
        } catch (e) {
            console.log("error - ", e.message);
        }
    }
};

const fillBillsTableAllSessions_summaryData = async () => {
    await db.openDatabase();
    for (const session of SESSION_LIST) {
        try {
            console.log("starting session id: " + session);
            await getAndWriteBillSummaryToDatabase(session);
            console.log("finished session id: " + session);
        } catch (e) {
            console.log("error - ", e.message);
        }
    }
};

const fillBillsTableAllSessions_policyData = async () => {
    await db.openDatabase();
    for (const session of SESSION_LIST) {
        try {
            console.log("starting session id: " + session);
            await getAndWriteBillPolicyDataToDatabase(session);
            console.log("finished session id: " + session);
        } catch (e) {
            console.log("error - ", e.message);
        }
    }
};

const getAllBillsBySessionFromApi = async (sessionId) => {
    //this gives a list of the bill titles in the session
    const allBillsJson = await getAllBillsBySessionFromGovApi(sessionId);

    //for each of the bills, get more details about the bill and create a Bill Object
    const promiseResult = await Promise.all(
        Array.from(allBillsJson).map(async (bill) => {
            try {
                if (!bill.number) {
                    return;
                }
                const billId = bill.number;
                const billInfo = await getBillFromGovApi(sessionId, billId);
                const billToAdd = new Bill(billInfo, sessionId);
                return billToAdd;
            } catch (e) {}
        }),
    );

    return promiseResult;
};

const writeBillsToDatabase = async (bills) => {
    try {
        for (const bill of bills) {
            await db.addToBills(bill);
        }

        return true;
    } catch (err) {
        console.log(`Error writing bills to database table. ${err.stack}`);
        return false;
    }
};

const getBillsBySessionFromDatabase = async (sessionId) => {
    const bills = await db.getAllBillsForSession(sessionId);
    const billObjects = bills?.map((bill) => new Bill(bill));
    return billObjects;
};

const getBaseBillNumber = (billNumber) => {
    return String(billNumber).toUpperCase().trim().replace(/S\d+$/, "");
};

const getAndWritePassedBillsToDatabase = async (sessionId) => {
    const allBills = await getBillsBySessionFromDatabase(sessionId);

    const passedBillsJson = await getPassedBillsFromGovApi(sessionId);

    for (const passedBill of passedBillsJson) {
        try {
            //in passedBills, it will return the version of the bill passed for the number
            //so we need to get rid of any trailing S01 version numbers - HB0005S01 to HB0005
            let baseBillNumber = getBaseBillNumber(passedBill.number);

            const matchingBill = allBills.find((bill) => {
                return bill.id === baseBillNumber;
            });

            if (!matchingBill) {
                console.log(
                    `No matching bill found for passed bill ${passedBill.number}`,
                );
                continue;
            }

            const billId = matchingBill.id;
            const datePassed = passedBill.datepassed;
            const effectiveDate = passedBill.effectivedate;

            //write whether the bill was passed or not to the database
            const result = await db.addPassedDataToBill(
                sessionId,
                billId,
                datePassed,
                effectiveDate,
            );
        } catch (e) {
            console.log(
                `Error adding passed bill information for ${passedBill.number}} - ${e.message}`,
            );
        }
    }
};

//check to see if the bill is a special session - then bill id will have S1/S2/etc at the end of it
function parseBillId(billId) {
    const value = String(billId || "")
        .toUpperCase()
        .trim();
    const match = value.match(/^(.*?)(S0?(\d+))$/);

    if (!match) {
        return {
            original: value,
            isSpecialSession: false,
            sessionSuffix: null,
            baseBillId: value,
        };
    }

    return {
        original: value,
        isSpecialSession: true,
        sessionSuffix: match[2],
        baseBillId: match[1],
    };
}

const getAndWriteFullBillTextToDatabase = async (sessionId) => {
    const allBills = await getBillsBySessionFromDatabase(sessionId);

    for (const bill of allBills) {
        try {
            const year = bill.year;
            const billId = bill.id;

            const specialSession = parseBillId(bill.session_id);

            let result;
            if (specialSession.isSpecialSession) {
                result = await getUtahBillText(bill.session_id, billId);
            } else {
                result = await getUtahBillText(year, billId);
            }

            //write whether the bill was passed or not to the database

            if (!result) {
                console.log(`No result returned for ${billId}`);
                continue;
            }

            const pdfUrl = result.pdfUrl;
            const fullText = result.fullText;

            const dbResult = await db.addFullTextToBill(
                sessionId,
                billId,
                fullText,
                pdfUrl,
            );
        } catch (e) {
            console.log(
                `Error adding pdf and text information for ${bill.id} - ${e.message}`,
            );
        }
    }
};

const getAndWriteBillSummaryToDatabase = async (sessionId) => {
    if (sessionId != "2026GS" && sessionId != "2025S2") return;

    const allBills = await getBillsBySessionFromDatabase(sessionId);

    let count = 0;
    for (const bill of allBills) {
        try {
            // const existingText = await db.getTextSummaryFromBill(
            //     sessionId,
            //     bill.id,
            // );

            // const stringText = existingText?.summary_text;

            // if (stringText) {
            //     continue;
            // }
            if (count > 300) {
                console.log("done with 300");
                return;
            }
            const summary = await getBillSummary(bill);
            if (summary == "") {
                console.log("error generating summary for " + bill.id);
                continue;
            }

            const result = await db.addTextSummaryToBill(
                bill.session_id,
                bill.id,
                summary,
            );

            if (!result) {
                console.log(`No result returned for ${bill.id}`);
            } else {
                console.log(`created summary for ${bill.id}`);
            }
            count = count + 1;
        } catch (e) {
            console.log(
                `Error adding ai summary information for ${bill.id} - ${e.message}`,
            );
        }
    }
};

const getAndWriteBillPolicyDataToDatabase = async (sessionId) => {
    const allBills = await getBillsBySessionFromDatabase(sessionId);

    for (const bill of allBills) {
        try {
            //don't redo policy topics that aready exist
            // const existingText = await db.getPolicyTopicsFromBill(
            //     sessionId,
            //     bill.id,
            // );
            // const stringText = existingText?.policy_topics;
            // if (stringText) {
            //     continue;
            // }

            //generate new policy topics
            const billPolicy = await getPolicyClassificationsForBills(bill);

            if (!billPolicy) {
                console.log(
                    `No policy topic returned for getPolicyClassificationsForBills ${bill.id}`,
                );
                continue;
            }

            const x = await db.addPolicyPropertiesToBill(
                bill.session_id,
                bill.id,
                billPolicy.measure_type,
                billPolicy.is_substantive,
                billPolicy.needs_review,
                billPolicy.review_reason,
            );

            if (!x) {
                console.log(`error writing policy properties to ${bill.id}`);
            }

            for (const topic of billPolicy.topics) {
                await db.addToPolicy(bill.session_id, bill.id, topic);
            }

            console.log(`added policy data for ${bill.id}`);
        } catch (e) {
            console.log(
                `Error adding policy information for ${bill.id} - ${e.message}`,
            );
        }
    }
};

const getAllSubjects = async (sessionId) => {
    await db.openDatabase();
    const allBills = await getBillsBySessionFromDatabase(sessionId);

    const subjectSet = new Set();

    try {
        for (const bill of allBills) {
            const subjectArray = bill.subjects
                .split(",")
                .map((item) => item.trim());
            subjectArray.forEach((subject) => subjectSet.add(subject));
        }
        console.log(subjectSet);
        writeFileSync(
            "C:/Users/Conner Schacherer/Desktop/Output1.txt",
            [...subjectSet].join("; "),
            "utf8",
        );
        return subjectSet;
    } catch (e) {
        console.log(e);
    }
};

// #endregion

// #region VOTES TABLE
const currentFillVotesTable = async () => {
    await db.openDatabase();
    for (const session of SESSION_LIST) {
        try {
            console.log("starting session id: " + session);

            const sessionBillObjects =
                await getBillsBySessionFromDatabase(session);

            await writeVotesToDb(sessionBillObjects);
            console.log("finished session id: " + session);
        } catch (e) {
            console.log("error - ", e.message);
        }
    }
};

const writeVotesToDb = async (allBills) => {
    try {
        for (let i = 0; i < allBills.length; i++) {
            const currentBill = allBills[i];
            try {
                if (currentBill.house_vote_url) {
                    const allHouseVotes = await scrapeBillVote(
                        currentBill.session_id,
                        currentBill.id,
                        currentBill.house_vote_url,
                        db,
                    );
                    const addHouseVotesToDb = await Promise.all(
                        allHouseVotes?.map((x) => db.addToVotes(x)),
                    );
                }
                if (currentBill.senate_vote_url) {
                    const allSenateVotes = await scrapeBillVote(
                        currentBill.session_id,
                        currentBill.id,
                        currentBill.senate_vote_url,
                        db,
                    );
                    const addSenateVotesToDb = await Promise.all(
                        allSenateVotes?.map((x) => db.addToVotes(x)),
                    );
                }
            } catch (err) {
                console.log(
                    `Error adding bill: ${currentBill.id}. ${err.message}`,
                );
            }
        }
        console.log("done writing bills");
        return true;
    } catch (err) {
        console.log(`Error filling votes table. ${err.stack}`);
        return false;
    }
};

// #endregion

//await createNewEmptyDatabase();
//await fillLegislatorsTable();
//await fillBillsTableAllSessions_generalData();
//await fillBillsTableAllSessions_passedData();
//await fillBillsTableAllSessions_textData();
//await currentFillVotesTable();
//await fillBillsTableAllSessions_summaryData();

await fillBillsTableAllSessions_policyData();

//const set = await getAllSubjects("2026GS");

//await currentFillVotesTable();
//await FillBillsTableByYearWebScrapiing();
// const result = await scrapeBillText(
//     "2026",
//     "HB0001",
//     "https://le.utah.gov/~2026/bills/static/HB0001.html",
// );
