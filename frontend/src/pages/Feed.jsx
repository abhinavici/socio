import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { getErrorMessage } from "../utils/http";
import Navbar from "../components/Navbar";

function Feed() {
  const [posts, setPosts] = useState([]);
  const [caption, setCaption] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Load feed on mount
  useEffect(() => {
    const fetchFeed = async () => {
      try {
        setIsLoading(true);
        const { data } = await API.get("/posts/feed");
        setPosts(data);
      } catch (error) {
        setErrorMessage(getErrorMessage(error, "Failed to load feed."));
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeed();
  }, []);

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Create post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!caption.trim() && !imageFile) {
      setErrorMessage("Post must have a caption or an image.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const formData = new FormData();
      if (caption.trim()) formData.append("caption", caption.trim());
      if (imageFile) formData.append("image", imageFile);

      const { data } = await API.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Add new post to top of feed
      setPosts((prev) => [{ ...data, isLiked: false }, ...prev]);
      setCaption("");
      setImageFile(null);
      setImagePreview("");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to create post."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Like / Unlike
  const handleLike = async (post) => {
    try {
      if (post.isLiked) {
        await API.delete(`/posts/${post._id}/like`);
        setPosts((prev) =>
          prev.map((p) =>
            p._id === post._id
              ? { ...p, isLiked: false, likesCount: p.likesCount - 1 }
              : p
          )
        );
      } else {
        await API.post(`/posts/${post._id}/like`);
        setPosts((prev) =>
          prev.map((p) =>
            p._id === post._id
              ? { ...p, isLiked: true, likesCount: p.likesCount + 1 }
              : p
          )
        );
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Action failed."));
    }
  };

  // Delete post
  const handleDelete = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await API.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to delete post."));
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: "600px", margin: "32px auto", padding: "0 16px" }}>

        {errorMessage && <p className="notice error">{errorMessage}</p>}

        {/* Create Post Box */}
        <form onSubmit={handleCreatePost} style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px", marginBottom: "24px", boxShadow: "var(--shadow)" }}>
          <textarea
            placeholder="What's on your mind?"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={500}
            rows={3}
            style={{ width: "100%", border: "none", background: "transparent", resize: "none", fontSize: "15px", fontFamily: "inherit", color: "var(--ink)", outline: "none" }}
          />
          <p style={{ fontSize: "12px", color: "var(--muted)", textAlign: "right", margin: "4px 0 12px" }}>
            {caption.length}/500
          </p>

          {/* Image Preview */}
          {imagePreview && (
            <div style={{ position: "relative", marginBottom: "12px" }}>
              <img src={imagePreview} alt="preview" style={{ width: "100%", borderRadius: "var(--radius-md)", maxHeight: "300px", objectFit: "cover" }} />
              <button type="button" onClick={() => { setImageFile(null); setImagePreview(""); }}
                style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", fontSize: "16px" }}>
                ×
              </button>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={{ cursor: "pointer", color: "var(--sea)", fontSize: "14px", fontWeight: 500 }}>
              📷 Add Photo
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
            </label>
            <button className="btn btn-primary" type="submit" disabled={isSubmitting} style={{ padding: "8px 24px" }}>
              {isSubmitting ? "Posting..." : "Post"}
            </button>
          </div>
        </form>

        {/* Feed */}
        {isLoading && <p style={{ textAlign: "center", color: "var(--muted)" }}>Loading feed...</p>}

        {!isLoading && posts.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)", background: "var(--panel)", borderRadius: "var(--radius-lg)", border: "1px dashed var(--border)" }}>
            <p style={{ fontSize: "20px" }}>🌱</p>
            <p>Your feed is empty. Follow people to see their posts!</p>
          </div>
        )}

        {posts.map((post) => (
          <div key={post._id} style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", marginBottom: "20px", boxShadow: "var(--shadow)", overflow: "hidden" }}>

            {/* Post Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
              <Link to={`/user/${post.author.username}`} style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--mint)", overflow: "hidden", border: "2px solid var(--sea)" }}>
                  {post.author.avatar
                    ? <img src={post.author.avatar} alt={post.author.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "var(--sea)", fontWeight: 700 }}>
                        {post.author.name?.charAt(0).toUpperCase()}
                      </div>
                  }
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: "var(--ink)", fontSize: "15px" }}>{post.author.name}</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>@{post.author.username}</p>
                </div>
              </Link>

              {/* Delete button — only for your own posts */}
              <button onClick={() => handleDelete(post._id)}
                style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "18px", padding: "4px 8px" }}
                title="Delete post">
                🗑
              </button>
            </div>

            {/* Post Image */}
            {post.image && (
              <img src={post.image} alt="post" style={{ width: "100%", maxHeight: "400px", objectFit: "cover" }} />
            )}

            {/* Caption */}
            {post.caption && (
              <p style={{ margin: "0", padding: "12px 16px", fontSize: "15px", color: "var(--ink)" }}>
                {post.caption}
              </p>
            )}

            {/* Like Button */}
            <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "8px" }}>
              <button onClick={() => handleLike(post)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "22px", padding: 0 }}>
                {post.isLiked ? "❤️" : "🤍"}
              </button>
              <span style={{ fontSize: "14px", color: "var(--muted)" }}>
                {post.likesCount} {post.likesCount === 1 ? "like" : "likes"}
              </span>
              <span style={{ fontSize: "12px", color: "var(--muted)", marginLeft: "auto" }}>
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>

          </div>
        ))}
      </div>
    </>
  );
}

export default Feed;