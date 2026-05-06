import { getErrorMessage } from "./errorHandling";
import apiClient from "./apiClient";
import { endpointsAPI } from "./endpointsAPI";
import { createLegislator } from "../models/Legislator";
import { createVote } from "../models/Vote";
import { createLegislatorVote } from "../models/LegislatorVote";
import { createBill } from "../models/Bill";
import {
    type LegislatorPolicyScore,
    createLegislatorPolicyScore,
} from "../models/LegislatorPolicyScore";

export const getAllLegislators = async () => {
    try {
        const response = await apiClient.get(endpointsAPI.legislators);
        const legislatorArray = response.data.map(createLegislator);
        return legislatorArray;
    } catch (error) {
        let msg = getErrorMessage(error);
        console.log(msg);
        throw new Error(msg);
    }
};

export const getLegislatorDetails = async (id: string) => {
    try {
        const response = await apiClient.get(
            endpointsAPI.legislatorDetails(id),
        );
        const legislator = createLegislator(response.data);
        return legislator;
    } catch (error) {
        let msg = getErrorMessage(error);
        console.log(msg);
        throw new Error(msg);
    }
};

export const getLegislatorVotes = async (id: string) => {
    try {
        const response = await apiClient.get(endpointsAPI.legislatorVotes(id));
        const votesArray = response.data.map(createLegislatorVote);
        return votesArray;
    } catch (error) {
        let msg = getErrorMessage(error);
        console.log(msg);
        throw new Error(msg);
    }
};

export const getLegislatorByDistrict = async (
    chamber: string,
    district: string,
) => {
    try {
        const response = await apiClient.get(
            endpointsAPI.legislatorDistricts(chamber, district),
        );
        const legislator = createLegislator(response.data);
        return legislator;
    } catch (error) {
        let msg = getErrorMessage(error);
        console.log(msg);
        throw new Error(msg);
    }
};

export const getLegislatorSponsoredBills = async (id: string) => {
    try {
        const response = await apiClient.get(
            endpointsAPI.legislatorSponsoredBills(id),
        );
        const votesArray = response.data.map(createBill);
        return votesArray;
    } catch (error) {
        let msg = getErrorMessage(error);
        console.log(msg);
        throw new Error(msg);
    }
};

export const getLegislatorAnalysisByYear = async (id: string, year: string) => {
    try {
        const response = await apiClient.get(
            endpointsAPI.legislatorAnalysis(id, year),
        );

        const policyScoreArray = response.data.map(createLegislatorPolicyScore);
        return policyScoreArray;
    } catch (error) {
        let msg = getErrorMessage(error);
        console.log(msg);
        throw new Error(msg);
    }
};
