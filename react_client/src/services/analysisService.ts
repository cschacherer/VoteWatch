import { getErrorMessage } from "./errorHandling";
import apiClient from "./apiClient";
import { endpointsAPI } from "./endpointsAPI";
import { createBill } from "../models/Bill";
import { createLegislatorVote } from "../models/LegislatorVote";
import { createLegislatorCouplePolicyScore } from "../models/LegislatorCouplePolicyScore";
import {
    createAnalysisYear,
    createLegislatureOverview,
    createPolicyCoupleOutcome,
} from "../models/LegislatureOverview";

export const getAllPolicyTopics = async () => {
    try {
        const response = await apiClient.get(endpointsAPI.bills);
        const billArray = response.data.map(createBill);
        return billArray;
    } catch (error) {
        let msg = getErrorMessage(error);
        console.log(msg);
        throw new Error(msg);
    }
};

export const getLegislatorAnalysisByYear = async (id: string, year: string) => {
    try {
        const response = await apiClient.get(
            endpointsAPI.analysisOfLegislator(id, year),
        );

        const policyScoreArray = response.data.map(
            createLegislatorCouplePolicyScore,
        );
        return policyScoreArray;
    } catch (error) {
        let msg = getErrorMessage(error);
        console.log(msg);
        throw new Error(msg);
    }
};

export const getLegislatorPolicyCoupleVotesByYear = async (
    id: string,
    year: string,
    policyCoupleName: string,
) => {
    try {
        const response = await apiClient.get(
            endpointsAPI.analysisOfLegislatorPolicyCouple(
                id,
                year,
                policyCoupleName,
            ),
        );

        const legislatorPolicyVoteArray =
            response.data.map(createLegislatorVote);
        return legislatorPolicyVoteArray;
    } catch (error) {
        let msg = getErrorMessage(error);
        console.log(msg);
        throw new Error(msg);
    }
};

export const getLegislatorPolicyDirectionAnalysisByYear = async (
    id: string,
    year: string,
    policyTopic: string,
    policyDirection: string,
) => {
    try {
        const response = await apiClient.get(
            endpointsAPI.analysisOfLegislatorPolicy(
                id,
                year,
                policyTopic,
                policyDirection,
            ),
        );

        const legislatorPolicyVoteArray =
            response.data.map(createLegislatorVote);
        return legislatorPolicyVoteArray;
    } catch (error) {
        let msg = getErrorMessage(error);
        console.log(msg);
        throw new Error(msg);
    }
};

//years that have bills, newest first, with whether each has policy scores
export const getAnalysisYears = async () => {
    try {
        const response = await apiClient.get(endpointsAPI.analysisYears);
        return response.data.map(createAnalysisYear);
    } catch (error) {
        let msg = getErrorMessage(error);
        console.log(msg);
        throw new Error(msg);
    }
};

//legislature-wide scores, participation, and topic counts for one year
export const getLegislatureOverview = async (year: string) => {
    try {
        const response = await apiClient.get(
            endpointsAPI.legislatureOverview(year),
        );
        return createLegislatureOverview(response.data);
    } catch (error) {
        let msg = getErrorMessage(error);
        console.log(msg);
        throw new Error(msg);
    }
};

//the passed bills behind one couple's legislature outcome score for a year
export const getPolicyCoupleOutcome = async (
    year: string,
    policyCoupleName: string,
) => {
    try {
        const response = await apiClient.get(
            endpointsAPI.policyCoupleOutcome(year, policyCoupleName),
        );
        return createPolicyCoupleOutcome(response.data);
    } catch (error) {
        let msg = getErrorMessage(error);
        console.log(msg);
        throw new Error(msg);
    }
};
