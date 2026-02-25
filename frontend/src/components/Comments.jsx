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
    <div style={{ padding: "0 16px 12px" }}>

      {errorMessage && (
        <p style={{ color: "var(--danger)", fontSize: "13px", margin: "4px 0" }}>{errorMessage}</p>
      )}

      {/* Comments List */}
      {isLoading && (
        <p style={{ fontSize: "13px", color: "var(--muted)" }}>Loading comments...</p>
      )}

      {!isLoading && comments.length === 0 && (
        <p style={{ fontSize: "13px", color: "var(--muted)", margin: "4px 0 12px" }}>
          No comments yet. Be the first!
        </p>
      )}

      <div style={{ maxHeight: "200px", overflowY: "auto", marginBottom: "12px" }}>
        {comments.map((comment) => (
          <div key={comment._id} style={{ display: "flex", gap: "8px", marginBottom: "10px", alignItems: "flex-start" }}>

            {/* Avatar */}
            <Link to={`/user/${comment.author.username}`}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--mint)", overflow: "hidden", border: "1px solid var(--sea)", flexShrink: 0 }}>
                {comment.author.avatar
                  ? <img src={comment.author.avatar} alt={comment.author.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "var(--sea)", fontWeight: 700 }}>
                      {comment.author.name?.charAt(0).toUpperCase()}
                    </div>
                }
              </div>
            </Link>

            {/* Comment bubble */}
            <div style={{ flex: 1, background: "var(--mint)", borderRadius: "0 12px 12px 12px", padding: "8px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Link to={`/user/${comment.author.username}`} style={{ fontWeight: 600, fontSize: "13px", color: "var(--ink)", textDecoration: "none" }}>
                  @{comment.author.username}
                </Link>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleDeleteComment(comment._id)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "var(--muted)", padding: 0 }}
                    title="Delete comment"
                  >
                    🗑
                  </button>
                </div>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--ink)" }}>{comment.text}</p>
            </div>

          </div>
        ))}
      </div>

      {/* Add Comment Input */}
      <form onSubmit={handleAddComment} style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          placeholder="Write a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={300}
          className="input-field"
          style={{ flex: 1, margin: 0, padding: "8px 12px", fontSize: "14px" }}
        />
        <button
          type="submit"
          disabled={isSubmitting || !text.trim()}
          className="btn btn-primary"
          style={{ padding: "8px 16px", fontSize: "14px" }}
        >
          {isSubmitting ? "..." : "Post"}
        </button>
      </form>

    </div>
  );
}

export default Comments;