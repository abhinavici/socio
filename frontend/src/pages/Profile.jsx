import { useState, useEffect } from "react";
import { removeToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { getErrorMessage } from "../utils/http";
import Navbar from "../components/Navbar";

function Profile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", bio: "", website: "", isPrivate: false });
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const handleLogout = () => {
    removeToken();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const { data } = await API.get("/users/me");
        setUser(data);
        setForm({ name: data.name, username: data.username, bio: data.bio || "", website: data.website || "", isPrivate: data.isPrivate || false });
        setAvatarPreview(data.avatar || "");
      } catch {
        navigate("/login", { replace: true });
      }
    };
    fetchMe();
  }, [navigate]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    const formData = new FormData();
    formData.append("avatar", avatarFile);
    try {
      setIsSubmitting(true);
      await API.put("/users/me/avatar", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setSuccessMessage("Avatar updated!");
      setAvatarFile(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to upload avatar."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setIsSubmitting(true);
      await API.delete("/users/me/avatar");
      setAvatarPreview("");
      setSuccessMessage("Avatar removed.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to remove avatar."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    try {
      setIsSubmitting(true);
      if (avatarFile) await handleAvatarUpload();
      const { data } = await API.put("/users/me", form);
      setUser(data);
      setIsEditing(false);
      setSuccessMessage("Profile updated successfully!");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to update profile."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="auth-page">
        <p className="profile-loading">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="auth-page">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />

        <main className="auth-card auth-card--wide" style={{ position: "relative" }}>
          {/* Logout button — top right of profile card */}
          <button className="profile-logout-btn" onClick={handleLogout} title="Logout">
            <span className="material-icons-round">logout</span>
          </button>

          <p className="auth-eyebrow">SocioSpace</p>

          {successMessage && <p className="notice success">{successMessage}</p>}
          {errorMessage   && <p className="notice error">{errorMessage}</p>}

          {/* Avatar */}
          <div className="profile-avatar-section">
            <div className="avatar avatar--xl">
              {avatarPreview
                ? <img src={avatarPreview} alt="avatar" />
                : <span className="avatar--initial">{user.name?.charAt(0).toUpperCase()}</span>
              }
            </div>

            {isEditing && (
              <div className="profile-avatar-actions">
                <label className="btn btn-primary btn-sm" style={{ cursor: "pointer" }}>
                  Change Photo
                  <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
                </label>
                {avatarPreview && (
                  <button className="btn btn-danger" onClick={handleRemoveAvatar} disabled={isSubmitting}>
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>

          {/* View Mode */}
          {!isEditing && (
            <div className="profile-view">
              <p className="profile-view__user-id">{user.userId}</p>
              <h2 className="profile-view__name">{user.name}</h2>
              <p className="profile-view__handle">@{user.username}</p>
              {user.bio     && <p className="profile-view__bio">{user.bio}</p>}
              {user.website && <a href={user.website} target="_blank" rel="noreferrer" className="profile-view__website">{user.website}</a>}

              <div className="profile-stats">
                <div className="profile-stat">
                  <strong>{user.followersCount}</strong>
                  <span className="profile-stat__label">Followers</span>
                </div>
                <div className="profile-stat">
                  <strong>{user.followingCount}</strong>
                  <span className="profile-stat__label">Following</span>
                </div>
              </div>

              <button className="btn btn-primary" onClick={() => setIsEditing(true)}>Edit Profile</button>
            </div>
          )}

          {/* Edit Mode */}
          {isEditing && (
            <form className="auth-form" onSubmit={handleSave}>
              <label className="input-label">Name</label>
              <input className="input-field" type="text" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />

              <label className="input-label">Username</label>
              <input className="input-field" type="text" value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })} />

              <label className="input-label">Bio</label>
              <textarea className="input-field text-area" rows={3} maxLength={160} value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              <p className="profile-edit__bio-counter">{form.bio.length}/160</p>

              <label className="input-label">Website</label>
              <input className="input-field" type="url" placeholder="https://yoursite.com" value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })} />

              <label className="checkbox-row">
                <input type="checkbox" checked={form.isPrivate}
                  onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })} />
                <span className="input-label" style={{ margin: 0 }}>Private account</span>
              </label>

              <div className="btn-row">
                <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" className="btn-cancel"
                  onClick={() => { setIsEditing(false); setErrorMessage(""); setSuccessMessage(""); }}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          <p className="profile-back-link">
            <a href="/feed">← Back to Feed</a>
          </p>
        </main>
      </div>
    </>
  );
}

export default Profile;
