import { getErrorMessage } from "./errorHandling";
import apiClient from "./apiClient";
import { endpointsAPI } from "./endpointsAPI";
import { createBill } from "../models/Bill";
import { createVote } from "../models/Vote";

export const getAllBills = async () => {
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

export const getBillDetails = async (sessionId: string, id: string) => {
    try {
        const response = await apiClient.get(
            endpointsAPI.billDetails(sessionId, id),
        );
        const bill = createBill(response.data);
        return bill;
    } catch (error) {
        let msg = getErrorMessage(error);
        console.log(msg);
        throw new Error(msg);
    }
};

export const getBillVotes = async (sessionId: string, id: string) => {
    try {
        const response = await apiClient.get(
            endpointsAPI.billVotes(sessionId, id),
        );
        const voteArray = response.data.map(createVote);
        return voteArray;
    } catch (error) {
        let msg = getErrorMessage(error);
        console.log(msg);
        throw new Error(msg);
    }
};
