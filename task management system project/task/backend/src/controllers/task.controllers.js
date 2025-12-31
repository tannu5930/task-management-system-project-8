import Task from "../models/task.model.js";
import Board from "../models/board.model.js";
import Notification from "../models/notification.model.js";


export const addTask = async (req, res)=> {
    const { taskName, description, priority, taskStatus, dueDate, category, boardId, assignedTo } = req.body;

    if (!req.userId) {
        return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    if(!taskName) {
        return res.status(400).json({message: "Task name is required!"})
    }

    try {
        let board = null;
        if (boardId) {
            board = await Board.findById(boardId);
            if (!board) {
                return res.status(404).json({ message: "Board not found" });
            }

            const isMember = board.members.some(member =>
                member.user.toString() === req.userId.toString()
            );
            const isOwner = board.owner.toString() === req.userId.toString();

            if (!isMember && !isOwner) {
                return res.status(403).json({ message: "You don't have access to this board" });
            }
        }

        const newTask = new Task({
            taskName,
            description: description || "",
            priority: priority || "Medium",
            taskStatus: taskStatus || "Pending",
            dueDate: dueDate ? new Date(dueDate) : null,
            category: category || "General",
            user: req.userId,
            board: boardId || null,
            assignedTo: assignedTo || [],
        });

        const saveTask = await newTask.save();
        await saveTask.populate('user', 'name email avatar');
        await saveTask.populate('assignedTo', 'name email avatar');
        await saveTask.populate('board', 'name');

        if (assignedTo && assignedTo.length > 0) {
            const notifications = assignedTo.map(userId => ({
                user: userId,
                type: 'task_assigned',
                title: 'Task Assigned',
                message: `You have been assigned to "${taskName}"`,
                data: {
                    taskId: saveTask._id,
                    boardId: boardId,
                    userId: req.userId,
                },
            }));
            await Notification.insertMany(notifications);
        }

        res.status(201).json({ task: saveTask });

    } catch (error) {
        console.error("Error adding task:", error);
        res.status(500).json({message: "Error while adding task!"})
    }
} 


export const getAllTask = async (req, res)=> {
    try {
        const { boardId } = req.query;

        let query = {
            $or: [
                { user: req.userId },
                { assignedTo: req.userId },
            ]
        };

        if (boardId) {
            query.board = boardId;

            const board = await Board.findById(boardId);
            if (!board) {
                return res.status(404).json({ message: "Board not found" });
            }

            const isMember = board.members.some(member =>
                member.user.toString() === req.userId.toString()
            );
            const isOwner = board.owner.toString() === req.userId.toString();

            if (!isMember && !isOwner && !board.isPublic) {
                return res.status(403).json({ message: "Access denied to this board" });
            }
        }

        const tasks = await Task.find(query)
            .populate('user', 'name email avatar')
            .populate('assignedTo', 'name email avatar')
            .populate({
                path: 'board',
                select: 'name members',
                populate: {
                    path: 'members.user',
                    select: 'name email avatar'
                }
            })
            .populate('comments.user', 'name email avatar')
            .sort({ createdAt: -1 });

        res.status(200).json(tasks);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ message: "server error!" });
    }
};


export const getTask = async (req, res) => {
    const { id } = req.params;
    
    if (!id) {
        return res.status(400).json({ message: "ID not given!" });
    }

    try {
        const task = await Task.findById(id);

        if (!task) {
            return res.status(404).json({ message: "Task not found!" });
        }

        if (task.user.toString() !== req.userId.toString()) {
            return res.status(403).json({ message: "Unauthorized! You do not own this task." });
        }

        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ message: "Server error!" });
    }
};



export const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { taskName, description, priority, dueDate, category } = req.body;

        if (!id) {
            return res.status(400).json({ message: "Invalid task ID!" });
        }

        const task = await Task.findOne({ _id: id, user: req.userId });
        if (!task) {
            return res.status(403).json({ message: "Unauthorized! Task does not belong to you." });
        }

        if (taskName !== undefined) task.taskName = taskName;
        if (description !== undefined) task.description = description;
        if (priority !== undefined) task.priority = priority;
        if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
        if (category !== undefined) task.category = category;

        await task.save();

        res.status(200).json(task);
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ message: "Server error!" });
    }
};


export const toggleTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        console.log(`[STATUS UPDATE] Task ID: ${id}, User: ${req.userId}, Payload:`, { status });

        if (!id) {
            return res.status(400).json({ message: "Invalid task ID!" });
        }

        const validStatuses = ["Pending", "In Progress", "Completed"];
        if (status && !validStatuses.includes(status)) {
            console.error(`[STATUS UPDATE] Invalid status: ${status}. Valid values: ${validStatuses.join(", ")}`);
            return res.status(400).json({ message: "Invalid status value!" });
        }

        const task = await Task.findById(id).populate('assignedTo', 'name email');
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const hasAccess = task.user.toString() === req.userId.toString() ||
                         task.assignedTo.some(user => user._id.toString() === req.userId.toString());

        if (!hasAccess) {
            return res.status(403).json({ message: "Unauthorized! You don't have access to this task." });
        }

        const oldStatus = task.taskStatus;
        console.log(`[STATUS UPDATE] Current status: ${oldStatus}, New status: ${status}`);

        if (status) {
            task.taskStatus = status;
        } else {
            if (task.taskStatus === "Pending") {
                task.taskStatus = "In Progress";
            } else if (task.taskStatus === "In Progress") {
                task.taskStatus = "Completed";
            } else {
                task.taskStatus = "Pending";
            }
        }

        console.log(`[STATUS UPDATE] Final taskStatus value being saved: ${task.taskStatus}`);
        await task.save();
        console.log(`[STATUS UPDATE] Task saved successfully`);
        await task.populate('user', 'name email avatar');
        await task.populate('assignedTo', 'name email avatar');

        if (oldStatus !== task.taskStatus) {
            const notifications = [];

            if (task.user._id.toString() !== req.userId.toString()) {
                notifications.push({
                    user: task.user._id,
                    type: 'task_status_changed',
                    title: 'Task Status Updated',
                    message: `"${task.taskName}" status changed from ${oldStatus} to ${task.taskStatus}`,
                    data: {
                        taskId: task._id,
                        oldValue: oldStatus,
                        newValue: task.taskStatus,
                        userId: req.userId,
                    },
                });
            }

            task.assignedTo.forEach(assignedUser => {
                if (assignedUser._id.toString() !== req.userId.toString()) {
                    notifications.push({
                        user: assignedUser._id,
                        type: 'task_status_changed',
                        title: 'Task Status Updated',
                        message: `"${task.taskName}" status changed from ${oldStatus} to ${task.taskStatus}`,
                        data: {
                            taskId: task._id,
                            oldValue: oldStatus,
                            newValue: task.taskStatus,
                            userId: req.userId,
                        },
                    });
                }
            });

            if (notifications.length > 0) {
                await Notification.insertMany(notifications);
            }
        }

        res.status(200).json(task);
    } catch (error) {
        console.error("Error toggling task status:", error);
        res.status(500).json({ message: "Server error!" });
    }
};


export const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;

        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const hasAccess = task.user.toString() === req.userId.toString() ||
                         task.assignedTo.some(user => user._id.toString() === req.userId.toString());

        if (!hasAccess) {
            return res.status(403).json({ message: "Unauthorized! You can't delete this task." });
        }

        await task.deleteOne();

        res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error!" });
    }
};

export const assignTask = async (req, res) => {
    const { id } = req.params;
    const { userIds } = req.body;

    try {
        const task = await Task.findById(id).populate('assignedTo', 'name email');
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const hasAccess = task.user.toString() === req.userId.toString() ||
                         task.assignedTo.some(user => user._id.toString() === req.userId.toString());

        if (!hasAccess) {
            return res.status(403).json({ message: "Unauthorized! You don't have access to this task." });
        }

        const oldAssigned = task.assignedTo.map(user => user._id.toString());
        const newAssigned = userIds || [];

        const newlyAssigned = newAssigned.filter(id => !oldAssigned.includes(id));

        task.assignedTo = newAssigned;
        await task.save();
        await task.populate('assignedTo', 'name email avatar');

        if (newlyAssigned.length > 0) {
            const notifications = newlyAssigned.map(userId => ({
                user: userId,
                type: 'task_assigned',
                title: 'Task Assigned',
                message: `You have been assigned to "${task.taskName}"`,
                data: {
                    taskId: task._id,
                    userId: req.userId,
                },
            }));
            await Notification.insertMany(notifications);
        }

        res.status(200).json(task);
    } catch (error) {
        console.error("Error assigning task:", error);
        res.status(500).json({ message: "Server error!" });
    }
};

export const addComment = async (req, res) => {
    const { id } = req.params;
    const { content, mentions } = req.body;

    if (!content) {
        return res.status(400).json({ message: "Comment content is required" });
    }

    try {
        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const hasAccess = task.user.toString() === req.userId.toString() ||
                         task.assignedTo.some(user => user._id.toString() === req.userId.toString());

        if (!hasAccess) {
            return res.status(403).json({ message: "Unauthorized! You don't have access to this task." });
        }

        const comment = {
            user: req.userId,
            content,
            mentions: mentions || [],
        };

        task.comments.push(comment);
        await task.save();
        await task.populate('comments.user', 'name email avatar');

        const notifications = [];
        const mentionedUsers = new Set(mentions || []);
        const participants = new Set([
            task.user.toString(),
            ...task.assignedTo.map(id => id.toString())
        ]);

        mentionedUsers.forEach(userId => {
            if (userId !== req.userId.toString()) {
                notifications.push({
                    user: userId,
                    type: 'task_comment_added',
                    title: 'Task Comment',
                    message: `${req.user.name} mentioned you in "${task.taskName}"`,
                    data: {
                        taskId: task._id,
                        userId: req.userId,
                    },
                });
            }
        });

        participants.forEach(userId => {
            if (userId !== req.userId.toString() && !mentionedUsers.has(userId)) {
                notifications.push({
                    user: userId,
                    type: 'task_comment_added',
                    title: 'Task Comment',
                    message: `${req.user.name} commented on "${task.taskName}"`,
                    data: {
                        taskId: task._id,
                        userId: req.userId,
                    },
                });
            }
        });

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        res.status(201).json(task.comments[task.comments.length - 1]);
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ message: "Server error!" });
    }
};

export const getTaskComments = async (req, res) => {
    const { id } = req.params;

    try {
        const task = await Task.findById(id).populate('comments.user', 'name email avatar');
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const hasAccess = task.user.toString() === req.userId.toString() ||
                         task.assignedTo.some(user => user._id.toString() === req.userId.toString());

        if (!hasAccess) {
            return res.status(403).json({ message: "Unauthorized! You don't have access to this task." });
        }

        res.status(200).json(task.comments);
    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ message: "Server error!" });
    }
};
