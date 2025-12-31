import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import API from "../library/api.js";
import taskApi from "../library/taskApi.js";
import Head from "../components/Head.jsx";
import Search from "../components/Search.jsx";
import TaskCard from "../components/TaskCard.jsx";
import Modal from "../components/Modal.jsx";
import SimpleModal from "../components/SimpleModal.jsx";
import KanbanBoard from "../components/KanbanBoard.jsx";
import BoardSelector from "../components/BoardSelector.jsx";
import NotificationBell from "../components/NotificationBell.jsx";
import TaskAssignment from "../components/TaskAssignment.jsx";
import CommentSection from "../components/CommentSection.jsx";
import usePortal from "../hooks/usePortal.js";
import { MdGridView, MdViewKanban } from "react-icons/md";
import toast from "react-hot-toast";

const Dashboard = () => {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [statusFilter, setStatusFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [viewMode, setViewMode] = useState("grid");
    const [selectedBoard, setSelectedBoard] = useState(null);
    const {isOpen, onOpen, onClose} = usePortal();
    const [selectedTask, setSelectedTask] = useState(null);
    const [search, setSearch] = useState("");
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [newTask, setNewTask] = useState({
        taskName: "",
        description: "",
        priority: "Medium",
        taskStatus: "Pending"
    });
    const [addingTask, setAddingTask] = useState(false);
    const { loading, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
    }, [loading, user, navigate]);

    useEffect(() => {
        if (user) {
            fetchTasks();
        }
    }, [user, selectedBoard]);

    useEffect(() => {
        filterTasks();
    }, [data, search, statusFilter, priorityFilter]);

    const fetchTasks = async () => {
        try {
            setLoadingTasks(true);
            const params = selectedBoard ? { boardId: selectedBoard._id } : {};
            const response = await taskApi.get('/', { params });
            const tasks = Array.isArray(response.data) ? response.data : (response.data.tasks || []);
            setData(tasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoadingTasks(false);
        }
    };

    const filterTasks = () => {
        let filtered = data;

        if (search) {
            filtered = filtered.filter(task =>
                task.taskName.toLowerCase().includes(search.toLowerCase()) ||
                task.description?.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (statusFilter !== "All") {
            filtered = filtered.filter(task => task.status === statusFilter);
        }

        if (priorityFilter !== "All") {
            filtered = filtered.filter(task => task.priority === priorityFilter);
        }

        setFilteredData(filtered);
    };

    const handleTaskUpdate = (updatedTask) => {
        setData(prev => prev.map(task =>
            task._id === updatedTask._id ? updatedTask : task
        ));
        setSelectedTask(prev => prev && prev._id === updatedTask._id ? updatedTask : prev);
    };

    const handleBoardSelect = (board) => {
        setSelectedBoard(board);
    };

    const handleBoardCreate = () => {
        fetchTasks();
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTask.taskName.trim()) return;

        try {
            setAddingTask(true);
            const taskData = {
                ...newTask,
                ...(selectedBoard && { boardId: selectedBoard._id })
            };

            const response = await taskApi.post('/', taskData);
            toast.success("Task created successfully!");
            
            await fetchTasks();
            
            setNewTask({
                taskName: "",
                description: "",
                priority: "Medium",
                taskStatus: "Pending"
            });
            onClose();
        } catch (error) {
            console.error('Error adding task:', error);
            toast.error("Failed to create task");
        } finally {
            setAddingTask(false);
        }
    };

    const handleUpdateTask = async (taskId, updatedData) => {
        try {
            let response;

            if (updatedData.taskStatus) {
                response = await taskApi.patch(`/${taskId}/status`, { status: updatedData.taskStatus });
            } else {
                response = await taskApi.put(`/${taskId}`, updatedData);
            }

            toast.success("Task updated successfully!");
            handleTaskUpdate(response.data);
        } catch (error) {
            console.error('Error updating task:', error);
            toast.error("Failed to update task");
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (window.confirm("Are you sure you want to delete this task?")) {
            try {
                await taskApi.delete(`/${taskId}`);
                setData(prev => prev.filter(task => task._id !== taskId));
                toast.success("Task deleted successfully!");
                setSelectedTask(null);
            } catch (error) {
                console.error('Error deleting task:', error);
                toast.error("Failed to delete task");
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-base-100">
                <div className="p-8 bg-base-200 shadow-lg rounded-lg">
                    <span className="loading loading-infinity loading-xl text-4xl text-blue-600"></span>
                    <p className="text-gray-600 mt-4">Loading your tasks...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-100 pb-8">
            <Head/>
            <div className="flex">
                <div className="w-80 bg-base-200 min-h-screen p-4 border-r border-base-300">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold mb-4">Boards</h2>
                        <BoardSelector
                            selectedBoard={selectedBoard}
                            onBoardSelect={handleBoardSelect}
                            onBoardCreate={handleBoardCreate}
                        />
                    </div>

                    <div className="mb-6">
                        <NotificationBell />
                    </div>

                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">Filters</h3>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="select select-bordered w-full"
                            >
                                <option value="All">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Priority</label>
                            <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                className="select select-bordered w-full"
                            >
                                <option value="All">All Priority</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">View</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`btn btn-sm ${viewMode === "grid" ? "btn-primary" : "btn-ghost"}`}
                            >
                                <MdGridView className="w-4 h-4 mr-1" />
                                Grid
                            </button>
                            <button
                                onClick={() => setViewMode("kanban")}
                                className={`btn btn-sm ${viewMode === "kanban" ? "btn-primary" : "btn-ghost"}`}
                            >
                                <MdViewKanban className="w-4 h-4 mr-1" />
                                Kanban
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 p-6">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold">
                            {selectedBoard ? selectedBoard.name : "All Tasks"}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {selectedBoard ? selectedBoard.description : "Manage your tasks across all boards"}
                        </p>
                    </div>

                    <Search isOpen={isOpen} onOpen={onOpen} onClose={onClose} setSearch={setSearch}/>

                    {loadingTasks ? (
                        <div className="flex justify-center items-center py-12">
                            <span className="loading loading-spinner loading-lg"></span>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">No Tasks</div>
                            <h3 className="text-xl font-semibold mb-2">No Tasks Found</h3>
                            <p className="text-gray-600">
                                {search || statusFilter !== "All" || priorityFilter !== "All"
                                    ? "Try adjusting your filters or search terms"
                                    : "Create your first task to get started"}
                            </p>
                        </div>
                    ) : viewMode === "grid" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredData.map((task) => (
                                <TaskCard
                                    key={task._id}
                                    task={task}
                                    onUpdate={handleTaskUpdate}
                                    onSelect={setSelectedTask}
                                    onDelete={handleDeleteTask}
                                />
                            ))}
                        </div>
                    ) : (
                        <KanbanBoard
                            tasks={filteredData}
                            onEdit={setSelectedTask}
                            onDelete={handleDeleteTask}
                            onStatusChange={handleTaskUpdate}
                        />
                    )}
                </div>
            </div>

            {selectedTask && (
                <SimpleModal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)}>
                    <div className="max-w-2xl w-full">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-2xl font-bold text-white">{selectedTask.taskName}</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleDeleteTask(selectedTask._id)}
                                    className="btn btn-sm btn-error text-white"
                                    title="Delete this task"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold mb-2 text-gray-300">Status</h3>
                                <div className="flex gap-2 flex-wrap">
                                    {['Pending', 'In Progress', 'Completed'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => handleUpdateTask(selectedTask._id, { taskStatus: status })}
                                            className={`btn btn-sm ${selectedTask.taskStatus === status ? 'btn-primary' : 'btn-outline'}`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold mb-2 text-gray-300">Description</h3>
                                <p className="text-gray-300">{selectedTask.description || "No description"}</p>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold mb-2 text-gray-300">Priority</h3>
                                <span className={`badge ${
                                    selectedTask.priority === 'High' ? 'badge-error' :
                                    selectedTask.priority === 'Medium' ? 'badge-warning' :
                                    'badge-success'
                                }`}>
                                    {selectedTask.priority}
                                </span>
                            </div>

                            <TaskAssignment
                                task={selectedTask}
                                board={selectedBoard || selectedTask.board}
                                onAssignmentChange={() => fetchTasks()}
                            />

                            <CommentSection
                                taskId={selectedTask._id}
                                board={selectedBoard || selectedTask.board}
                                task={selectedTask}
                                onCommentAdd={() => {
                                    fetchTasks();
                                }}
                            />
                        </div>
                    </div>
                </SimpleModal>
            )}

            <SimpleModal isOpen={isOpen} onClose={onClose}>
                <div className="max-w-md w-full">
                    <h2 className="text-2xl font-bold mb-4 text-white">Add New Task</h2>

                    <form onSubmit={handleAddTask} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-white">Task Name</label>
                            <input
                                type="text"
                                value={newTask.taskName}
                                onChange={(e) => setNewTask({...newTask, taskName: e.target.value})}
                                className="input input-bordered w-full bg-base-200 text-white placeholder-gray-400"
                                placeholder="Enter task name"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-white">Description</label>
                            <textarea
                                value={newTask.description}
                                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                                className="textarea textarea-bordered w-full bg-base-200 text-white placeholder-gray-400"
                                placeholder="Enter task description"
                                rows="3"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-white">Priority</label>
                                <select
                                    value={newTask.priority}
                                    onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                                    className="select select-bordered w-full bg-base-200 text-white"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-white">Status</label>
                                <select
                                    value={newTask.taskStatus}
                                    onChange={(e) => setNewTask({...newTask, taskStatus: e.target.value})}
                                    className="select select-bordered w-full bg-base-200 text-white"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn btn-ghost text-white hover:bg-base-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={addingTask}
                            >
                                {addingTask ? <span className="loading loading-spinner loading-sm"></span> : "Add Task"}
                            </button>
                        </div>
                    </form>
                </div>
            </SimpleModal>
        </div>
    );
};

export default Dashboard;