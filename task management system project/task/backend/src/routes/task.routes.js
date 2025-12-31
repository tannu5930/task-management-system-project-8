import express from "express";
import {
  getTask,
  getAllTask,
  updateTask,
  deleteTask,
  addTask,
  toggleTaskStatus,
  assignTask,
  addComment,
  getTaskComments
} from "../controllers/task.controllers.js";
import { authCheck } from "../middleware/authCheck.js";


const taskRouter = express.Router();

taskRouter.use(authCheck);

taskRouter.post("/", addTask);
taskRouter.get("/", getAllTask);
taskRouter.get("/:id", getTask);

taskRouter.put("/:id", updateTask);
taskRouter.patch("/:id/status", toggleTaskStatus);
taskRouter.patch("/:id/assign", assignTask);
taskRouter.delete("/:id", deleteTask);

taskRouter.post("/:id/comments", addComment);
taskRouter.get("/:id/comments", getTaskComments);

export default taskRouter;