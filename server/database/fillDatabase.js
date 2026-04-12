import Database from "./database.js";
import Bill from "../classes/bill.js";
import Legislator from "../classes/legislator.js";
import { getAllBillsBySession, getBill, getPassedBills } from "./getBills.js";
import { getAllLegislators } from "./getLegislators.js";
import { scrapeBillVote } from "./getVotes.js";
import { SESSION_LIST } from "./constants.js";

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
            const sessionBillObjects = await getBillData(session);
            await writeBillsToDb(sessionBillObjects);
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
const getBillData = async (sessionId) => {
    //only works for 2025 right now
    const allBills = await getAllBillsBySession(sessionId);

    const passedBills = await getPassedBills(sessionId);
    // const passedBillIds = passedBills.map((bill) => bill.number);

    const promiseResult = await Promise.all(
        Array.from(allBills).map(async (bill) => {
            if (!bill.number) {
                return;
            }
            const billId = bill.number;
            const billInfo = await getBill(sessionId, billId);
            const billToAdd = new Bill(billInfo);

            let passedBillData = passedBills?.find(
                (bill) => bill.number == billId,
            );
            if (passedBillData) {
                billToAdd.setPassed(passedBillData);
            } else {
                let x = 0;
            }
            // if (passedBillIds.contains(billId)) {
            //     let billData = passedBills.find(
            //         (bill) => bill.number == billId,
            //     );
            //     billToAdd.addPassedData(billData);
            // }
            return billToAdd;
        }),
    );

    return promiseResult;
};

const writeBillsToDb = async (allBills) => {
    try {
        const addingBillsToDatabase = Array.from(allBills).map((bill) =>
            db.addToBills(bill),
        );

        await Promise.all(addingBillsToDatabase);

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
                    );
                    const addHouseVotesToDb = await Promise.all(
                        allHouseVotes.map((x) => db.addToVotes(x)),
                    );
                }
                if (currentBill.senateVoteUrl) {
                    const allSenateVotes = await scrapeBillVote(
                        currentBill.sessionId,
                        currentBill.id,
                        currentBill.senateVoteUrl,
                    );
                    const addSenateVotesToDb = await Promise.all(
                        allSenateVotes.map((x) => db.addToVotes(x)),
                    );
                }
            } catch (err) {
                console.log(
                    `Error adding bill: ${currentBill.id}. ${err.message}`,
                );
            }
        }

        return true;
    } catch (err) {
        console.log(`Error filling votes table. ${err.stack}`);
        return false;
    }
};

//await createNewEmptyDatabase();
//await currentFillLegislatorsTable();
await currentFillBillsTable();
