import { createNewDatabase, addToLegislators, closeDatabase, addToBills, addToVotes } from './database.js';
import { getAllBillsByYear, getAllLegislators, getBill } from './getOnlineData.js';
import Bill from '../classes/bill.js';
import Legislator from '../classes/legislator.js';
import { scrapeBillVote } from './voteWebScraping.js';

const fillLegislatorsTable = async () => {
    try {
        //only works for 2025 right now 
        const allLegislators = await getAllLegislators();

        const allLegislatorsClass = allLegislators.map(leg => new Legislator(leg));

        await Promise.all(allLegislatorsClass.map(async legislator => {
            await addToLegislators(legislator);
        }));

        return true;
    } catch (err) {
        console.log(`Error filling legislator table. ${err.stack}`);
        return false;
    }
};

const getBills = async (year) => {
    //only works for 2025 right now 
    const allBills = await getAllBillsByYear(year);

    const promiseResult = await Promise.all(Array.from(allBills).map(async bill => {
        if (!bill.number) {
            let x = 8;
        }
        const billId = bill.number;
        const billInfo = await getBill(year, billId)
        const billToAdd = new Bill(billInfo);
        return billToAdd;
    }));

    return promiseResult;
}

const fillBillsTable = async (allBills) => {
    try {
        //only works for 2025 right now 
        //const year = 2025;
        //const allBills = await getBills(year);
        const addingBillsToDatabase = Array.from(allBills).map(bill => addToBills(bill));

        await Promise.all(addingBillsToDatabase);

        return true;
    } catch (err) {
        console.log(`Error filling bills table. ${err.stack}`);
        return false;
    }
}

const fillVotesTable = async (allBills) => {
    try {
        //const year = 2025;
        //const allBills = await getBills(year);

        for (let i = 0; i < allBills.length; i++) {
            try {
                const currentBill = allBills[i];
                if (currentBill.houseVoteUrl) {
                    const allHouseVotes = await scrapeBillVote(currentBill.year, currentBill.id, currentBill.houseVoteUrl);
                    const addHouseVotesToDb = await Promise.all(allHouseVotes.map(x => addToVotes(x)));
                }
                if (currentBill.senateVoteUrl) {
                    const allSenateVotes = await scrapeBillVote(currentBill.year, currentBill.id, currentBill.senateVoteUrl);
                    const addSenateVotesToDb = await Promise.all(allSenateVotes.map(x => addToVotes(x)));
                }
                console.log(`added bill: ${currentBill.id}`);
            } catch (err) {
                console.log(`///////////////////////////////////Error adding bill: ${currentBill.id}`);
            }
        }

        return true;

    } catch (err) {
        console.log(`Error filling votes table. ${err.stack}`);
        return false;
    }
}

const createNewAndFillDatabase = async (dbName) => {
    await createNewDatabase(dbName);
    await fillLegislatorsTable();
    const BillsIn2025 = await getBills(2025);
    await fillBillsTable(BillsIn2025);
    await fillVotesTable(BillsIn2025);
    console.log('x');
}

let databaseName = './server/database/voteWatch.db';
await createNewAndFillDatabase(databaseName);

