import axios from "axios";

const boardApi = axios.create({
    baseURL: import.meta.env.MODE === "development" ? "http://localhost:9000/api/board" : "/api/board",
    withCredentials: true,
});

export default boardApi;