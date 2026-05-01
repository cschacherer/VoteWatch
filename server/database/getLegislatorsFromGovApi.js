//GET ALL LEGISLATORS FROM THE GOVERNMENT WEBSITE AND API
import { DEV_TOKEN, BASE_URL } from "./constants.js";

//this calls the utah government legislator API and returns JSON responses
export const getAllLegislatorsFromGovApi = async () => {
    const legislatorsUrl = `/legislators/${DEV_TOKEN}`;
    const finalUrl = BASE_URL + legislatorsUrl;

    try {
        const response = await fetch(finalUrl, { method: "GET" });
        if (response.ok) {
            const allLegislators = await response.json();
            return allLegislators.legislators;
        }
    } catch (err) {
        console.log(`Error: ${err.message}`);
    }
};

export const getLegislatorFromGovApi = async (legislatorId) => {
    const legislatorsUrl = `/legislator/${legislatorId}/${DEV_TOKEN}`;
    const finalUrl = BASE_URL + legislatorsUrl;

    try {
        const response = await fetch(finalUrl, { method: "GET" });
        if (response.ok) {
            const legislator = await response.json();
            return legislator;
        }
    } catch (err) {
        console.log(`Error: ${err.message}`);
    }
};

export const getLegislatorByDistrictFromGovApi = async (
    chamber,
    districtNumber,
) => {
    const legislatorsUrl = `/legislator/${chamber}/${districtNumber}/${DEV_TOKEN}`;
    const finalUrl = BASE_URL + legislatorsUrl;

    try {
        const response = await fetch(finalUrl, { method: "GET" });
        if (response.ok) {
            const districtLegislator = await response.json();
            return districtLegislator;
        }
    } catch (err) {
        console.log(`Error: ${err.message}`);
    }
};
