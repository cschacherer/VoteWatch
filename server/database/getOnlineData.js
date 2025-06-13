//Get legislature data 
const devToken = '83C4D87BC38A20EE125713B39B56AA5B';
const baseUrl = 'https://glen.le.utah.gov';


const getAllLegislators = async () => {
    const legislatorsUrl = `/legislators/${devToken}`;
    const finalUrl = baseUrl + legislatorsUrl;

    try {
        const response = await fetch(finalUrl, { method: 'GET' });
        if (response.ok) {
            const allLegislators = await response.json();
            return allLegislators.legislators;
        }
    } catch (err) {
        console.log(`Error: ${err.message}`);
    }
};

const getLegislator = async (legislatorId) => {
    const legislatorsUrl = `/legislator/${legislatorId}/${devToken}`;
    const finalUrl = baseUrl + legislatorsUrl;

    try {
        const response = await fetch(finalUrl, { method: 'GET' });
        if (response.ok) {
            const legislator = await response.json();
            return legislator;
        }
    } catch (err) {
        console.log(`Error: ${err.message}`);
    }
};

const getLegislatorByDistrict = async (chamber, districtNumber) => {
    const legislatorsUrl = `/legislator/${chamber}/${districtNumber}/${devToken}`;
    const finalUrl = baseUrl + legislatorsUrl;

    try {
        const response = await fetch(finalUrl, { method: 'GET' });
        if (response.ok) {
            const districtLegislator = await response.json();
            return districtLegislator;
        }
    } catch (err) {
        console.log(`Error: ${err.message}`);
    }
};

const getAllBillsByYear = async (year) => {
    const billsUrl = `/bills/${year}GS/billlist/${devToken}`;
    const finalUrl = baseUrl + billsUrl;

    try {
        const response = await fetch(finalUrl, { method: 'GET' });
        if (response.ok) {
            const allBills = await response.json();
            return allBills;
        }
    } catch (err) {
        console.log(`Error: ${err.message}`);
    }
};

const getBill = async (year, billId) => {
    const billsUrl = `/bills/${year}GS/${billId}/${devToken}`;
    const finalUrl = baseUrl + billsUrl;

    try {
        const response = await fetch(finalUrl, { method: 'GET' });
        if (response.ok) {
            const bill = await response.json();
            return bill;
        }
    } catch (err) {
        console.log(`Error: ${err.message}`);
    }
};


export { getAllLegislators, getLegislator, getLegislatorByDistrict, getAllBillsByYear, getBill }; 