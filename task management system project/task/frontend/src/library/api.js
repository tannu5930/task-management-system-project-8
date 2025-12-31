import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.MODE === "development" ? "http://localhost:9000/api/auth" : "/api/auth",
    withCredentials: true,
})

export default API;