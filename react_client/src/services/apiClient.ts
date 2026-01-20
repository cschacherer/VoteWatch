import axios from "axios";

const apiClient = axios.create({
    baseURL: "http://127.0.0.1:3005", //server api
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

export default apiClient;
