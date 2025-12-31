import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
    mentions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
}, { timestamps: true });

const taskSchema = new mongoose.Schema({
    taskName: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: "",
        trim: true,
    },
    taskStatus: {
        type: String,
        enum: ["Pending", "In Progress", "Completed"],
        default: "Pending"
    },
    priority: {
        type: String,
        enum: ["Low", "Medium", "High"],
        default: "Medium"
    },
    dueDate: {
        type: Date,
        default: null,
    },
    category: {
        type: String,
        default: "General",
        trim: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    board: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Board",
        default: null,
    },
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    comments: [commentSchema],
    tags: [{
        type: String,
        trim: true,
    }],
}, {
    timestamps: true
});

taskSchema.index({ user: 1, board: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ board: 1, taskStatus: 1 });

const Task = mongoose.model("Task", taskSchema);
export default Task;