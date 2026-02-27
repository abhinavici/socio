import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { getErrorMessage } from "../utils/http";
import Navbar from "../components/Navbar";
import Comments from "../components/Comments";

function Feed() {
  const [posts, setPosts] = useState([]);
  const [caption, setCaption] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

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

  const handleLike = async (post) => {
    try {
      if (post.isLiked) {
        await API.delete(`/posts/${post._id}/like`);
        setPosts((prev) =>
          prev.map((p) =>
            p._id === post._id ? { ...p, isLiked: false, likesCount: p.likesCount - 1 } : p
          )
        );
      } else {
        await API.post(`/posts/${post._id}/like`);
        setPosts((prev) =>
          prev.map((p) =>
            p._id === post._id ? { ...p, isLiked: true, likesCount: p.likesCount + 1 } : p
          )
        );
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Action failed."));
    }
  };

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
      <div className="feed-layout">

        {errorMessage && <p className="notice error">{errorMessage}</p>}

        {/* Create Post */}
        <form onSubmit={handleCreatePost} className="post-composer">
          <textarea
            className="post-composer__textarea"
            placeholder="What's on your mind?"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <p className="post-composer__char-count">{caption.length}/500</p>

          {imagePreview && (
            <div className="post-composer__image-preview">
              <img src={imagePreview} alt="preview" />
              <button
                type="button"
                className="post-composer__remove-image"
                onClick={() => { setImageFile(null); setImagePreview(""); }}
              >×</button>
            </div>
          )}

          <div className="post-composer__divider" />
          <div className="post-composer__actions">
            <label className="photo-upload-label">
              📷 Add Photo
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
            </label>
            <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Posting..." : "Post"}
            </button>
          </div>
        </form>

        {/* Feed */}
        {isLoading && <div className="feed-loading"><p>Loading feed...</p></div>}

        {!isLoading && posts.length === 0 && (
          <div className="feed-empty">
            <p className="feed-empty__emoji">🌱</p>
            <p>Your feed is empty. Follow people to see their posts!</p>
          </div>
        )}

        {posts.map((post) => (
          <article key={post._id} className="post-card">
            <div className="post-card__header">
              <Link to={`/user/${post.author.username}`} className="post-author-link">
                <div className="avatar avatar--md">
                  {post.author.avatar
                    ? <img src={post.author.avatar} alt={post.author.name} />
                    : <span className="avatar--initial">{post.author.name?.charAt(0).toUpperCase()}</span>
                  }
                </div>
                <div>
                  <p className="user-info__name">{post.author.name}</p>
                  <p className="user-info__handle">@{post.author.username}</p>
                </div>
              </Link>
              <button className="delete-post-btn" onClick={() => handleDelete(post._id)} title="Delete post">
                🗑
              </button>
            </div>

            {post.image && <img src={post.image} alt="post" className="post-card__image" />}
            {post.caption && <p className="post-card__caption">{post.caption}</p>}

            <div className="post-card__actions">
              <button className="like-btn" onClick={() => handleLike(post)}>
                {post.isLiked ? "❤️" : "🤍"}
              </button>
              <span className="likes-count">{post.likesCount} {post.likesCount === 1 ? "like" : "likes"}</span>
              <span className="post-date">{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="post-card__comments">
              <Comments postId={post._id} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

export default Feed;
