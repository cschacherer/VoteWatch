const _baseUrl = 'http://localhost:3005';

async function getAllLegislators() {
    try {
        const url = new URL(_baseUrl + '/legislators');
        const response = await fetch(url, { method: 'get' });
        if (response.ok) {
            return response.json();
        }
    } catch (err) {
        console.log(err);
    }
}

async function getLegislatorDetails(legislatorId) {
    try {
        let url = new URL(_baseUrl + `/legislators/${legislatorId}`);

        const response = await fetch(url, { method: 'get' });
        if (response.ok) {
            return response.json();
        }
    } catch (err) {
        console.log(err);
    }
}

async function getAllVotesFromLegislator(legislatorId) {
    try {
        let url = new URL(_baseUrl + `/legislators/${legislatorId}/votes`);

        const response = await fetch(url, { method: 'get' });
        if (response.ok) {
            return response.json();
        }
    } catch (err) {
        console.log(err);
    }
}

async function getAllBills() {
    try {
        let url = new URL(_baseUrl + `/bills`);

        const response = await fetch(url, { method: 'get' });
        if (response.ok) {
            return response.json();
        }
    } catch (err) {
        console.log(err);
    }
}

async function getBillDetails(id) {
    try {
        let url = new URL(_baseUrl + `/bills/${id}`);

        const response = await fetch(url, { method: 'get' });
        if (response.ok) {
            return response.json();
        }
    } catch (err) {
        console.log(err);
    }
}


export {
    getAllLegislators,
    getLegislatorDetails,
    getAllBills,
    getBillDetails,
    getAllVotesFromLegislator
}; 