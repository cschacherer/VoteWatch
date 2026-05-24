import { getErrorMessage } from "./errorHandling";
import apiClient from "./apiClient";
import { endpointsAPI } from "./endpointsAPI";
import { createBill } from "../models/Bill";
import { createLegislatorVote } from "../models/LegislatorVote";
import { createLegislatorPolicyScore } from "../models/LegislatorPolicyScore";

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

        const policyScoreArray = response.data.map(createLegislatorPolicyScore);
        return policyScoreArray;
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
