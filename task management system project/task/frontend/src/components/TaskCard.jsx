import React, { useState } from 'react'
import { MdOutlineEdit, MdOutlineDelete } from "react-icons/md";
import { FaFlag, FaCalendarAlt } from "react-icons/fa";
import taskApi from '../library/taskApi';

const TaskCard = ({ task, onUpdate, onSelect, onEdit, onDelete, onStatusChange }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const data = task || {};

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-500';
      case 'Medium': return 'text-yellow-500';
      case 'Low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-500';
      case 'In Progress': return 'bg-blue-500';
      case 'Pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const handleStatusToggle = async () => {
    setIsUpdating(true);
    try {
      let nextStatus = "In Progress";
      if (data.taskStatus === "Pending") {
        nextStatus = "In Progress";
      } else if (data.taskStatus === "In Progress") {
        nextStatus = "Completed";
      } else if (data.taskStatus === "Completed") {
        nextStatus = "Pending";
      }

      console.log("Sending status update:", { status: nextStatus });
      const response = await taskApi.patch(`/${data._id}/status`, { status: nextStatus });
      console.log("Status update response:", response.data);
      
      if (onStatusChange) {
        onStatusChange(response.data);
      } else if (onUpdate) {
        onUpdate(response.data);
      }
    } catch (error) {
      console.error('Error updating status:', error.response?.data || error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = () => {
    if (!data || !data.dueDate || data.taskStatus === 'Completed') return false;
    return new Date(data.dueDate) < new Date();
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(data);
    } else if (onEdit) {
      onEdit(data);
    }
  };

  if (!data || !data._id) {
    return null;
  }

  return (
    <div 
      className={`max-w-md w-full mx-auto border rounded-2xl p-4 mb-4 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] hover:border-blue-300 cursor-pointer ${
        data.taskStatus === 'Completed' ? 'bg-green-50 border-green-200' :
        isOverdue() ? 'bg-red-50 border-red-200' : 'bg-base-200 border-gray-200'
      }`}
      onClick={handleCardClick}
    >

      <div className='flex justify-between items-start mb-3'>
        <div className='flex items-center gap-2'>
          <FaFlag className={`${getPriorityColor(data.priority)} text-sm`} />
          <span className='text-xs font-medium text-gray-600 uppercase tracking-wide'>
            {data.priority}
          </span>
        </div>

        <div className='flex gap-2'>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onEdit) {
                onEdit(data);
              } else if (onSelect) {
                onSelect(data);
              }
            }}
            className='text-gray-500 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50'
            title="Edit task"
          >
            <MdOutlineEdit size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onDelete) {
                onDelete(data._id);
              }
            }}
            className='text-gray-500 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50'
            title="Delete task"
          >
            <MdOutlineDelete size={18} />
          </button>
        </div>
      </div>

      <h3 className={`font-semibold text-lg mb-2 ${
        data.taskStatus === 'Completed' ? 'line-through text-gray-500' : 'text-gray-900'
      }`}>
        {data.taskName}
      </h3>

      {data.description && (
        <p className='text-gray-600 text-sm mb-3 line-clamp-2'>
          {data.description}
        </p>
      )}

      {data.dueDate && (
        <div className={`flex items-center gap-2 mb-3 text-sm ${
          isOverdue() ? 'text-red-600' : 'text-gray-500'
        }`}>
          <FaCalendarAlt size={14} />
          <span className={isOverdue() ? 'font-medium' : ''}>
            Due: {formatDate(data.dueDate)}
            {isOverdue() && ' (Overdue)'}
          </span>
        </div>
      )}

      {data.category && data.category !== 'General' && (
        <div className='mb-3'>
          <span className='inline-block bg-base-100 text-gray-700 text-xs px-2 py-1 rounded-full'>
            {data.category}
          </span>
        </div>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          handleStatusToggle();
        }}
        disabled={isUpdating}
        className={`w-full py-2 px-4 rounded-lg font-medium text-white transition-all duration-200 ${
          getStatusColor(data.taskStatus)
        } hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isUpdating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="loading loading-spinner loading-sm"></span>
            Updating...
          </span>
        ) : (
          data.taskStatus
        )}
      </button>

      {data.assignedTo && data.assignedTo.length > 0 && (
        <div className='mt-3'>
          <div className='text-xs text-gray-500 mb-2'>Assigned to:</div>
          <div className='flex flex-wrap gap-1'>
            {data.assignedTo.map((user) => (
              <div
                key={user._id}
                className='flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs'
                title={user.name}
              >
                <div className='w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs'>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className='truncate max-w-16'>{user.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className='text-xs text-gray-400 mt-3 text-center space-y-1'>
        <div>Created: {formatDateTime(data.createdAt)}</div>
        {data.updatedAt !== data.createdAt && (
          <div>Updated: {formatDateTime(data.updatedAt)}</div>
        )}
      </div>
    </div>
  )
}

export default TaskCard