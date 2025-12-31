import axios from "axios";

const notificationApi = axios.create({
    baseURL: import.meta.env.MODE === "development" ? "http://localhost:9000/api/notifications" : "/api/notifications",
    withCredentials: true,
});

export default notificationApi;