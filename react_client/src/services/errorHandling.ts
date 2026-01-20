import axios from "axios";

export const getErrorMessage = (e: unknown): string => {
    if (axios.isAxiosError(e)) {
        let axiosMsg = e.message;
        let responseMsg = e?.response?.data?.message ?? "";
        return `${axiosMsg}. ${responseMsg}`;
    } else if (e instanceof Error) {
        return e.message;
    } else if (e && typeof e === "object" && "message" in e) {
        return String(e.message);
    } else if (e && typeof e === "object" && "toString" in e) {
        return String(e.toString());
    } else if (e && typeof e === "string") {
        return e;
    } else {
        return "Unknown error";
    }
};
