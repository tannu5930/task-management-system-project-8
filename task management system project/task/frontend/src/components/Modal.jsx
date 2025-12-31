import { createPortal } from "react-dom";
import { useForm, Controller } from "react-hook-form";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import taskApi from "../library/taskApi.js";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import TaskAssignment from "./TaskAssignment.jsx";
import CommentSection from "./CommentSection.jsx";


const Modal = ({ isOpen, onClose, taskData, isUpdate, reload }) => {
  const { control, register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm();
  const { user } = useAuth();

  useEffect(()=> {
    if(isUpdate && taskData){
      reset({
        taskName: taskData.taskName,
        description: taskData.description || "",
        priority: taskData.priority || "Medium",
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
        category: taskData.category || "General"
      });
    } else {
      reset({
        taskName: "",
        description: "",
        priority: "Medium",
        dueDate: null,
        category: "General"
      });
    }
  }, [taskData, isUpdate, reset])


  const onSubmit = async (data) => {
    try {
      if (!user?._id) {
        console.error("User is not logged in!");
        return;
      }

      const payload = {
        taskName: data.taskName,
        description: data.description,
        priority: data.priority,
        dueDate: data.dueDate ? data.dueDate.toISOString() : null,
        category: data.category,
        user: user._id,
      };

      let response;

      if (isUpdate) {
        response = await taskApi.put(`/${taskData._id}`, payload);
        console.log("Task updated:", response.data);
      } else {
        response = await taskApi.post("/", payload);
        console.log("Task added:", response.data);
      }

      reset();
      onClose();
      reload();

    } catch (error) {
      console.error("Error while adding/updating task:", error.response?.data || error.message);
    }
  };


  if (!isOpen) return null;


  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-md z-50">
      <div className="bg-base-200 p-6 rounded-lg shadow-xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl cursor-pointer"
        >
          &times;
        </button>

        <h2 className="text-xl font-bold mb-6 text-gray-900">
          {isUpdate ? "Edit Task" : "Add New Task"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Name *
            </label>
            <input
              {...register("taskName", { required: "Task name is required" })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-base-200"
              placeholder="Enter task name"
            />
            {errors.taskName && (
              <p className="text-red-500 text-sm mt-1">{errors.taskName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register("description")}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-black bg-base-200"
              placeholder="Enter task description (optional)"
              rows="3"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                {...register("priority")}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-base-200"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                {...register("category")}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-base-200"
                placeholder="e.g., Work, Personal"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date & Time
            </label>
            <Controller
              control={control}
              name="dueDate"
              render={({ field }) => (
                <DatePicker
                  selected={field.value}
                  onChange={(date) => field.onChange(date)}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  timeCaption="Time"
                  dateFormat="MMMM d, yyyy h:mm aa"
                  placeholderText="Select due date and time"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  wrapperClassName="w-full"
                  minDate={new Date()}
                />
              )}
            />
          </div>

          {isUpdate && data && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-700">
                <strong>Created:</strong> {new Date(data.createdAt).toLocaleString()}
                {data.updatedAt !== data.createdAt && (
                  <div className="mt-1">
                    <strong>Last Updated:</strong> {new Date(data.updatedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}

          {isUpdate && taskData && (
            <TaskAssignment
              task={taskData}
              board={taskData.board}
              onAssignmentChange={reload}
            />
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn btn-soft btn-primary cursor-pointer text-white text-2xl rounded-2xl p-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="loading loading-spinner loading-sm"></span>
                {isUpdate ? "Updating..." : "Adding..."}
              </span>
            ) : (
              isUpdate ? "Update Task" : "Add Task"
            )}
          </button>

        </form>

        {isUpdate && taskData && (
          <CommentSection
            taskId={taskData._id}
            board={taskData.board}
          />
        )}

      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

export default Modal;
