import React, { useState, useEffect } from 'react';
import { FaPaperPlane, FaAt } from 'react-icons/fa';
import { addComment, getTaskComments } from '../library/taskApi';

const CommentSection = ({ taskId, board, task }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [mentions, setMentions] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  const fetchComments = async () => {
    try {
      const response = await getTaskComments(taskId);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setLoading(true);
      await addComment(taskId, newComment.trim(), mentions);
      setNewComment('');
      setMentions([]);
      await fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentChange = (e) => {
    const value = e.target.value;
    setNewComment(value);

    const atIndex = value.lastIndexOf('@');
    if (atIndex !== -1) {
      const searchText = value.substring(atIndex + 1);
      setMentionSearch(searchText);
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionSearch('');
    }
  };

  const handleMentionSelect = (user) => {
    const atIndex = newComment.lastIndexOf('@');
    const beforeAt = newComment.substring(0, atIndex);
    const afterAt = newComment.substring(atIndex + mentionSearch.length + 1);

    setNewComment(`${beforeAt}@${user.name} ${afterAt}`);
    setMentions(prev => [...prev, user._id]);
    setShowMentions(false);
    setMentionSearch('');
  };

  const boardUsers = board?.members?.map(member => member.user) || [];
  const taskUsers = task ? [
    task.user,
    ...(task.assignedTo || [])
  ].filter((user, index, arr) =>
    arr.findIndex(u => u._id === user._id) === index
  ) : [];

  const availableUsers = boardUsers.length > 0 ? boardUsers : taskUsers;
  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="mt-4">
      <h4 className="text-md font-semibold mb-3">Comments</h4>

      <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            No comments yet
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="flex gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
                {comment.user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{comment.user.name}</span>
                  <span className="text-xs text-gray-500">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmitComment} className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={newComment}
              onChange={handleCommentChange}
              placeholder="Add a comment... Use @ to mention users"
              className="textarea textarea-bordered w-full resize-none"
              rows="2"
              disabled={loading}
            />

            {showMentions && filteredUsers.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 bg-base-100 border border-base-300 rounded-lg shadow-lg z-50 max-h-32 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    onClick={() => handleMentionSelect(user)}
                    className="w-full text-left p-2 hover:bg-base-200 flex items-center gap-2"
                  >
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm">{user.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-primary self-end"
            disabled={loading || !newComment.trim()}
          >
            <FaPaperPlane className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default CommentSection;