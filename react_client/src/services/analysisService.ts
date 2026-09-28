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
    createTopicOutcome,
    createPartyCoupleScore,
    type TopicOutcome,
    type PartyCoupleScore,
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

//session is optional - the server computes one session's scores live, since only years are stored
export const getLegislatorAnalysisByYear = async (
    id: string,
    year: string,
    session?: string | null,
) => {
    try {
        const response = await apiClient.get(
            endpointsAPI.analysisOfLegislator(id, year, session),
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
    session?: string | null,
) => {
    try {
        const response = await apiClient.get(
            endpointsAPI.analysisOfLegislatorPolicyCouple(
                id,
                year,
                policyCoupleName,
                session,
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
//every legislator's couple scores for a year or one session - the party medians are worked out from these
export const getLegislatureCoupleScores = async (
    year: string,
    session?: string | null,
) => {
    try {
        const response = await apiClient.get(
            endpointsAPI.legislatureCoupleScores(year, session),
        );
        return response.data.map(createPartyCoupleScore) as PartyCoupleScore[];
    } catch (error) {
        let msg = getErrorMessage(error);
        console.log(msg);
        throw new Error(msg);
    }
};

//what passed per topic for one session - the overview already has the whole year's outcomes
export const getPolicyOutcomes = async (year: string, session: string) => {
    try {
        const response = await apiClient.get(
            endpointsAPI.policyOutcomes(year, session),
        );
        return response.data.map(createTopicOutcome) as TopicOutcome[];
    } catch (error) {
        let msg = getErrorMessage(error);
        console.log(msg);
        throw new Error(msg);
    }
};

export const getPolicyCoupleOutcome = async (
    year: string,
    policyCoupleName: string,
    session?: string | null,
) => {
    try {
        const response = await apiClient.get(
            endpointsAPI.policyCoupleOutcome(year, policyCoupleName, session),
        );
        return createPolicyCoupleOutcome(response.data);
    } catch (error) {
        let msg = getErrorMessage(error);
        console.log(msg);
        throw new Error(msg);
    }
};
