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
    const allBills = await db.getAllBillsForSession(sessionId);
    return allBills;
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

//takes the data from the gov api and creates the Bill object to be written to the database
const getBillData = async (sessionId) => {
    //only works for 2025 right now
    const allBills = await getAllBillsBySessionFromGovApi(sessionId);
    //allBills.sort((a, b) => a.number.localeCompare(b.number));

    const passedBills = await getPassedBillsFromGovApi(sessionId);
    // const passedBillIds = passedBills.map((bill) => bill.number);

    const promiseResult = await Promise.all(
        Array.from(allBills).map(async (bill) => {
            try {
                if (!bill.number) {
                    return;
                }
                const billId = bill.number;
                const billInfo = await getBillFromGovApi(sessionId, billId);
                const billToAdd = new Bill(billInfo);

                let passedBillData = passedBills?.find((bill) =>
                    String(bill.number).includes(billId),
                );
                if (passedBillData) {
                    billToAdd.setPassed(passedBillData);
                } else {
                    billToAdd.passed = false;
                }
                return billToAdd;
            } catch (e) {}
        }),
    );

    return promiseResult;
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

const writeBillFullTextToDb = async (allBills) => {
    try {
        // const addingBillsToDatabase = Array.from(allBills).map((bill) =>
        //     db.addToBills(bill),
        // );

        // await Promise.all(addingBillsToDatabase);

        for (const bill of allBills) {
            const result = await scrapeBillText(bill.year, bill.id, bill.link);
            bill.fullText = result.full_text;
            bill.moneyAppropriated = result.money_appropriated;
            await db.addToBills(bill);
        }

        return true;
    } catch (err) {
        console.log(`Error filling bills table. ${err.stack}`);
        return false;
    }
};

//await createNewEmptyDatabase();
//await fillLegislatorsTable();
//await fillBillsTableAllSessions_generalData();
//await fillBillsTableAllSessions_passedData();
//await fillBillsTableAllSessions_textData();
//await currentFillVotesTable();

//await currentFillVotesTable();
//await FillBillsTableByYearWebScrapiing();
// const result = await scrapeBillText(
//     "2026",
//     "HB0001",
//     "https://le.utah.gov/~2026/bills/static/HB0001.html",
// );
