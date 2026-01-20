import { getErrorMessage } from "./errorHandling";
import apiClient from "./apiClient";
import { endpointsAPI } from "./endpointsAPI";

export const getAllBills = async () => {
    try {
        const response = await apiClient.get(endpointsAPI.bills);
        return response.data;
    } catch (error) {
        let msg = getErrorMessage(error);
        console.log(msg);
        throw new Error(msg);
    }
};

export const getBillDetails = async (id: string) => {
    try {
        const response = await apiClient.get(endpointsAPI.billDetails(id));
        return response.data;
    } catch (error) {
        let msg = getErrorMessage(error);
        console.log(msg);
        throw new Error(msg);
    }
};
