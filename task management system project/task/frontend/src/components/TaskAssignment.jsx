import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaUserMinus, FaSearch } from 'react-icons/fa';
import boardApi from '../library/boardApi';
import { assignTask } from '../library/taskApi';

const TaskAssignment = ({ task, board, onAssignmentChange }) => {
  const [assignedUsers, setAssignedUsers] = useState(task.assignedTo || []);
  const [boardMembers, setBoardMembers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (board) {
      setBoardMembers(board.members || []);
    }
  }, [board]);

  const handleAssignUser = async (userId) => {
    try {
      setLoading(true);
      const newAssignedUsers = [...assignedUsers.map(u => u._id), userId];
      await assignTask(task._id, newAssignedUsers);

      const userToAdd = boardMembers.find(member => member.user._id === userId);
      if (userToAdd) {
        setAssignedUsers(prev => [...prev, userToAdd.user]);
      }

      onAssignmentChange && onAssignmentChange();
    } catch (error) {
      console.error('Error assigning user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignUser = async (userId) => {
    try {
      setLoading(true);
      const newAssignedUsers = assignedUsers
        .filter(u => u._id !== userId)
        .map(u => u._id);
      await assignTask(task._id, newAssignedUsers);

      setAssignedUsers(prev => prev.filter(u => u._id !== userId));

      onAssignmentChange && onAssignmentChange();
    } catch (error) {
      console.error('Error unassigning user:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = boardMembers.filter(member => {
    const user = member.user;
    const searchLower = searchTerm.toLowerCase();
    return user.name.toLowerCase().includes(searchLower) ||
           user.email.toLowerCase().includes(searchLower);
  });

  const availableMembers = filteredMembers.filter(member =>
    !assignedUsers.some(assigned => assigned._id === member.user._id)
  );

  if (!board) {
    return (
      <div className="text-sm text-gray-500">
        Task assignment requires a board context
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium">Assigned to:</span>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="btn btn-ghost btn-xs"
          disabled={loading}
        >
          <FaUserPlus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        {assignedUsers.map((user) => (
          <div
            key={user._id}
            className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
          >
            <span>{user.name}</span>
            <button
              onClick={() => handleUnassignUser(user._id)}
              className="hover:bg-blue-200 rounded-full p-0.5"
              disabled={loading}
            >
              <FaUserMinus className="w-3 h-3" />
            </button>
          </div>
        ))}
        {assignedUsers.length === 0 && (
          <span className="text-sm text-gray-500">No one assigned</span>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-base-100 border border-base-300 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="relative mb-2">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered input-sm w-full pl-9"
              />
            </div>

            <div className="max-h-40 overflow-y-auto">
              {availableMembers.length === 0 ? (
                <div className="text-center py-2 text-gray-500 text-sm">
                  No available users
                </div>
              ) : (
                availableMembers.map((member) => (
                  <button
                    key={member.user._id}
                    onClick={() => handleAssignUser(member.user._id)}
                    className="w-full text-left p-2 hover:bg-base-200 rounded flex items-center gap-2"
                    disabled={loading}
                  >
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs">
                      {member.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{member.user.name}</div>
                      <div className="text-xs text-gray-500">{member.role}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default TaskAssignment;