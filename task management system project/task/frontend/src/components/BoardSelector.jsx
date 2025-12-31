import React, { useState, useEffect } from 'react';
import { FaPlus, FaUsers, FaCrown } from 'react-icons/fa';
import boardApi from '../library/boardApi';

const BoardSelector = ({ selectedBoard, onBoardSelect, onBoardCreate }) => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const response = await boardApi.get('/');
      setBoards(response.data);
    } catch (error) {
      console.error('Error fetching boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    try {
      const response = await boardApi.post('/', {
        name: newBoardName.trim(),
        description: newBoardDescription.trim(),
      });

      setBoards(prev => [response.data, ...prev]);
      setNewBoardName('');
      setNewBoardDescription('');
      setShowCreateForm(false);
      onBoardCreate && onBoardCreate(response.data);
    } catch (error) {
      console.error('Error creating board:', error);
    }
  };

  return (
    <div className="bg-base-200 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Boards</h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-primary btn-sm"
        >
          <FaPlus className="w-4 h-4" />
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateBoard} className="mb-4 space-y-2">
          <input
            type="text"
            placeholder="Board name"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            className="input input-bordered input-sm w-full"
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={newBoardDescription}
            onChange={(e) => setNewBoardDescription(e.target.value)}
            className="textarea textarea-bordered textarea-sm w-full"
            rows="2"
          />
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary btn-sm">
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        <button
          onClick={() => onBoardSelect(null)}
          className={`w-full text-left p-2 rounded btn btn-ghost ${
            !selectedBoard ? 'btn-active' : ''
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              Create New Board
            </div>
            <div>
              <div className="font-medium">Personal Tasks</div>
              <div className="text-xs opacity-70">Your private tasks</div>
            </div>
          </div>
        </button>

        {loading ? (
          <div className="text-center py-4">
            <div className="loading loading-spinner loading-sm"></div>
          </div>
        ) : (
          boards.map((board) => (
            <button
              key={board._id}
              onClick={() => onBoardSelect(board)}
              className={`w-full text-left p-2 rounded btn btn-ghost ${
                selectedBoard?._id === board._id ? 'btn-active' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-secondary rounded flex items-center justify-center">
                  Select Board
                </div>
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-1">
                    {board.name}
                    {board.owner._id === board.members.find(m => m.role === 'owner')?.user._id && (
                      <FaCrown className="w-3 h-3 text-yellow-500" />
                    )}
                  </div>
                  <div className="text-xs opacity-70 flex items-center gap-1">
                    <FaUsers className="w-3 h-3" />
                    {board.members.length} members
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default BoardSelector;