import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { getErrorMessage } from "../utils/http";

function Comments({ postId }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setIsLoading(true);
        const { data } = await API.get(`/comments/${postId}`);
        setComments(data);
      } catch (error) {
        setErrorMessage(getErrorMessage(error, "Failed to load comments."));
      } finally {
        setIsLoading(false);
      }
    };
    fetchComments();
  }, [postId]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      setIsSubmitting(true);
      setErrorMessage("");
      const { data } = await API.post(`/comments/${postId}`, { text: text.trim() });
      setComments((prev) => [...prev, data]);
      setText("");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to add comment."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await API.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to delete comment."));
    }
  };

  return (
    <div className="comments">
      {errorMessage && <p className="comments__error">{errorMessage}</p>}
      {isLoading && <p className="comments__loading">Loading comments...</p>}
      {!isLoading && comments.length === 0 && (
        <p className="comments__empty">No comments yet. Be the first!</p>
      )}

      <div className="comments__list">
        {comments.map((comment) => (
          <div key={comment._id} className="comment-item">
            <Link to={`/user/${comment.author.username}`}>
              <div className="avatar avatar--sm">
                {comment.author.avatar
                  ? <img src={comment.author.avatar} alt={comment.author.name} />
                  : <span className="avatar--initial">{comment.author.name?.charAt(0).toUpperCase()}</span>
                }
              </div>
            </Link>
            <div className="comment-bubble">
              <div className="comment-bubble__header">
                <Link to={`/user/${comment.author.username}`} className="comment-author-link">
                  @{comment.author.username}
                </Link>
                <div className="comment-meta">
                  <span className="comment-date">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  <button className="comment-delete-btn" onClick={() => handleDeleteComment(comment._id)} title="Delete comment">
                    🗑
                  </button>
                </div>
              </div>
              <p className="comment-text">{comment.text}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleAddComment} className="comment-form">
        <input
          type="text"
          placeholder="Write a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={300}
          className="input-field"
        />
        <button type="submit" disabled={isSubmitting || !text.trim()} className="btn btn-primary comment-submit">
          {isSubmitting ? "..." : "Post"}
        </button>
      </form>
    </div>
  );
}

export default Comments;
