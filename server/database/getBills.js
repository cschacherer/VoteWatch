//GET ALL BILLS FROM THE GOVERNMENT WEBSITE AND API
import { DEV_TOKEN, BASE_URL } from "./constants.js";

const test =
    "https://glen.le.utah.gov/bills/2026GS/billlist/83C4D87BC38A20EE125713B39B56AA5B";

export const getAllBillsBySession = async (sessionId) => {
    const billsUrl = `/bills/${sessionId}/billlist/${DEV_TOKEN}`;
    const finalUrl = BASE_URL + billsUrl;

    try {
        const response = await fetch(finalUrl, { method: "GET" });
        if (response.ok) {
            const allBills = await response.json();
            return allBills;
        }
    } catch (err) {
        console.log(`Error: ${err.message}`);
    }
};

export const getBill = async (sessionId, billId) => {
    const billsUrl = `/bills/${sessionId}/${billId}/${DEV_TOKEN}`;
    const finalUrl = BASE_URL + billsUrl;

    try {
        const response = await fetch(finalUrl, { method: "GET" });
        if (response.ok) {
            const bill = await response.json();
            return bill;
        }
    } catch (err) {
        console.log(`Error: ${err.message}`);
    }
};

export const getPassedBills = async (sessionId) => {
    const billsUrl = `/bills/${sessionId}/passedlist/${DEV_TOKEN}`;
    const finalUrl = BASE_URL + billsUrl;

    try {
        const response = await fetch(finalUrl, { method: "GET" });
        if (response.ok) {
            const jsonObject = await response.json();
            return jsonObject.passedbills;
        }
    } catch (err) {
        console.log(`Error: ${err.message}`);
    }
};
