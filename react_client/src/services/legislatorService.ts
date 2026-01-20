import { getErrorMessage } from "./errorHandling";
import apiClient from "./apiClient";
import { endpointsAPI } from "./endpointsAPI";

export const getAllLegislators = async () => {
    try {
        const response = await apiClient.get(endpointsAPI.legislators);
        return response.data;
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
        return response.data;
    } catch (error) {
        let msg = getErrorMessage(error);
        console.log(msg);
        throw new Error(msg);
    }
};

export const getLegislatorVotes = async (id: string) => {
    try {
        const response = await apiClient.get(endpointsAPI.legislatorVotes(id));
        return response.data;
    } catch (error) {
        let msg = getErrorMessage(error);
        console.log(msg);
        throw new Error(msg);
    }
};
