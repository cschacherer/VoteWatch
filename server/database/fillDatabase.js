import Database from "./database.js";
import Bill from "../classes/bill.js";
import Legislator from "../classes/legislator.js";
import { getAllBillsBySession, getBill, getPassedBills } from "./getBills.js";
import { getAllLegislators } from "./getLegislators.js";
import { scrapeBillVote } from "./getVotes.js";
import { SESSION_LIST } from "./constants.js";
import { scrapeBillText } from "./webScraping.js";

//let databaseName = './server/database/voteWatch.db';
let db;

const createNewEmptyDatabase = async () => {
    db = new Database();
    await db.createNewDatabase();
};

const currentFillLegislatorsTable = async () => {
    db = new Database();
    await db.openDatabase();
    await writeLegislatorsToDb();
};

const currentFillBillsTable = async () => {
    db = new Database();

    await db.openDatabase();
    for (const session of SESSION_LIST) {
        try {
            console.log("starting session id: " + session);
            const sessionBillObjects = await getBillData(session);

            for (const sessionBillObject of sessionBillObjects) {
                const result = await scrapeBillText(
                    sessionBillObject.year,
                    sessionBillObject.id,
                    sessionBillObject.link,
                );
                //sessionBillObject.moneyAppropriated = result.money_appropriated;
                sessionBillObject.fullText = result.full_text;
            }
            await writeBillsToDb(sessionBillObjects);
            console.log("finished session id: " + session);
        } catch (e) {
            console.log("error - ", e.message);
        }
    }
};

const FillBillsTableByYear = async () => {
    db = new Database();

    await db.openDatabase();

    const sessions = ["2026GS"];

    for (const session of sessions) {
        try {
            console.log("starting session id: " + session);
            const sessionBillObjects = await getBillData(session);

            await writeBillsToDb(sessionBillObjects);
            console.log("finished session id: " + session);
        } catch (e) {
            console.log("error - ", e.message);
        }
    }
};

const FillBillsTableByYearWebScrapiing = async () => {
    db = new Database();

    await db.openDatabase();

    const sessions = ["2026"];

    for (const session of sessions) {
        try {
            console.log("starting session id: " + session);
            const sessionBillObjects = await getBillData(session);

            await writeBillFullTextToDb(sessionBillObjects);
            console.log("finished session id: " + session);
        } catch (e) {
            console.log("error - ", e.message);
        }
    }
};

const currentFillVotesTable = async () => {
    db = new Database();

    await db.openDatabase();
    for (const session of SESSION_LIST) {
        try {
            console.log("starting session id: " + session);

            const sessionBillObjects = await db.getAllBillsForSession(session);
            await writeVotesToDb(sessionBillObjects);
            console.log("finished session id: " + session);
        } catch (e) {
            console.log("error - ", e.message);
        }
    }
};

//gets the current roster of legislators from the gov api and writes it to the database
const writeLegislatorsToDb = async () => {
    try {
        const allLegislators = await getAllLegislators();

        const allLegislatorsClass = allLegislators?.map(
            (leg) => new Legislator(leg),
        );

        await Promise.all(
            allLegislatorsClass.map(async (legislator) => {
                await db.addToLegislators(legislator);
            }),
        );

        return true;
    } catch (err) {
        console.log(`Error filling legislator table. ${err.stack}`);
        return false;
    }
};

//takes the data from the gov api and creates the Bill object to be written to the database
const getBillsFromDatabase = async (sessionId) => {
    //only works for 2025 right now
    const allBills = await db.getAllBillsBySession(sessionId);
    return allBills;
};

//takes the data from the gov api and creates the Bill object to be written to the database
const getBillData = async (sessionId) => {
    //only works for 2025 right now
    const allBills = await getAllBillsBySession(sessionId);
    //allBills.sort((a, b) => a.number.localeCompare(b.number));

    const passedBills = await getPassedBills(sessionId);
    // const passedBillIds = passedBills.map((bill) => bill.number);

    const promiseResult = await Promise.all(
        Array.from(allBills).map(async (bill) => {
            try {
                if (!bill.number) {
                    return;
                }
                const billId = bill.number;
                const billInfo = await getBill(sessionId, billId);
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

const writeBillsToDb = async (allBills) => {
    try {
        // const addingBillsToDatabase = Array.from(allBills).map((bill) =>
        //     db.addToBills(bill),
        // );

        // await Promise.all(addingBillsToDatabase);

        for (const bill of allBills) {
            await db.addToBills(bill);
        }

        return true;
    } catch (err) {
        console.log(`Error filling bills table. ${err.stack}`);
        return false;
    }
};

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

const writeVotesToDb = async (allBills) => {
    try {
        for (let i = 0; i < allBills.length; i++) {
            const currentBill = allBills[i];
            try {
                if (currentBill.houseVoteUrl) {
                    const allHouseVotes = await scrapeBillVote(
                        currentBill.sessionId,
                        currentBill.id,
                        currentBill.houseVoteUrl,
                        db,
                    );
                    const addHouseVotesToDb = await Promise.all(
                        allHouseVotes?.map((x) => db.addToVotes(x)),
                    );
                }
                if (currentBill.senateVoteUrl) {
                    const allSenateVotes = await scrapeBillVote(
                        currentBill.sessionId,
                        currentBill.id,
                        currentBill.senateVoteUrl,
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

//await createNewEmptyDatabase();
//await currentFillLegislatorsTable();
await currentFillBillsTable();
//await currentFillVotesTable();

//await FillBillsTableByYearWebScrapiing();
// const result = await scrapeBillText(
//     "2026",
//     "HB0001",
//     "https://le.utah.gov/~2026/bills/static/HB0001.html",
// );
