import { getErrorMessage } from "./errorHandling";
import apiClient from "./apiClient";
import { endpointsAPI } from "./endpointsAPI";
import { createLegislator } from "../models/Legislator";
import { createVote } from "../models/Vote";
import { createLegislatorVote } from "../models/LegislatorVote";

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
