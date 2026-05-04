import { getErrorMessage } from "./errorHandling";
import apiClient from "./apiClient";
import { endpointsAPI } from "./endpointsAPI";
import { createBill } from "../models/Bill";
import { createVote } from "../models/Vote";

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
