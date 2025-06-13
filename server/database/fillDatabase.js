import { createNewDatabase, addToLegislators, closeDatabase, addToBills } from './database.js';
import { getAllBillsByYear, getAllLegislators, getBill } from './getOnlineData.js';
import Bill from '../bill.js';
import Legislator from '../legislator.js';

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

const fillBillsTable = async () => {
    try {
        //only works for 2025 right now 
        const year = 2025;

        const allBills = await getAllBillsByYear(year);

        await Promise.all(Array.from(allBills).map(async bill => {
            const billId = bill.number;
            const billInfo = await getBill(year, billId)
            const billToAdd = new Bill(billInfo);
            await addToBills(billToAdd);
        }));

        return true;
    } catch (err) {
        console.log(`Error filling bills table. ${err.stack}`);
        return false;
    }

}

await createNewDatabase();
await fillLegislatorsTable();
await fillBillsTable();
await closeDatabase();
console.log('x'); 