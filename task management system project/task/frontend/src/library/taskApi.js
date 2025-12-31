import axios from "axios";

const taskApi = axios.create({
    baseURL:  import.meta.env.MODE === "development" ? "http://localhost:9000/api/task" : "/api/task",
    withCredentials: true,
});

export const assignTask = (taskId, userIds) => {
    return taskApi.patch(`/${taskId}/assign`, { userIds });
};

export const addComment = (taskId, content, mentions) => {
    return taskApi.post(`/${taskId}/comments`, { content, mentions });
};

export const getTaskComments = (taskId) => {
    return taskApi.get(`/${taskId}/comments`);
};

export default taskApi;
