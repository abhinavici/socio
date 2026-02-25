import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { getErrorMessage } from "../utils/http";
import Navbar from "../components/Navbar";

function Profile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    username: "",
    bio: "",
    website: "",
    isPrivate: false,
  });
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  // Load current user profile
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const { data } = await API.get("/users/me");
        setUser(data);
        setForm({
          name: data.name,
          username: data.username,
          bio: data.bio || "",
          website: data.website || "",
          isPrivate: data.isPrivate || false,
        });
        setAvatarPreview(data.avatar || "");
      } catch (error) {
        navigate("/login", { replace: true });
      }
    };
    fetchMe();
  }, [navigate]);

  // Handle avatar file selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // Upload avatar to Cloudinary via backend
  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    const formData = new FormData();
    formData.append("avatar", avatarFile);
    try {
      setIsSubmitting(true);
      await API.put("/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccessMessage("Avatar updated!");
      setAvatarFile(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to upload avatar."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove avatar
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

  // Save profile changes
  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    try {
      setIsSubmitting(true);

      // Upload avatar first if a new one was selected
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
        <p style={{ textAlign: "center", marginTop: "40vh" }}>Loading...</p>
      </div>
    );
  }

  return (
    <>
    <Navbar />
    <div className="auth-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <main className="auth-card" style={{ maxWidth: "520px" }}>
        <p className="auth-eyebrow">Task Pilot</p>

        {successMessage ? <p className="notice success">{successMessage}</p> : null}
        {errorMessage ? <p className="notice error">{errorMessage}</p> : null}

        {/* Avatar */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "24px" }}>
          <div style={{
            width: 100, height: 100, borderRadius: "50%",
            background: "var(--mint)", overflow: "hidden",
            border: "3px solid var(--sea)", marginBottom: "12px"
          }}>
            {avatarPreview
              ? <img src={avatarPreview} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, color: "var(--sea)" }}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
            }
          </div>

          {isEditing && (
            <div style={{ display: "flex", gap: "8px" }}>
              <label className="btn btn-primary" style={{ fontSize: "13px", padding: "6px 14px", cursor: "pointer" }}>
                Change Photo
                <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
              </label>
              {avatarPreview && (
                <button className="btn" onClick={handleRemoveAvatar} disabled={isSubmitting}
                  style={{ fontSize: "13px", padding: "6px 14px", background: "var(--danger)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>
                  Remove
                </button>
              )}
            </div>
          )}
        </div>

        {/* View Mode */}
        {!isEditing && (
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: "0 0 2px", fontSize: "11px", color: "var(--muted)" }}>{user.userId}</p>
            <h2 style={{ margin: "0 0 4px", fontSize: "22px" }}>{user.name}</h2>
            <p style={{ margin: "0 0 8px", color: "var(--sea)" }}>@{user.username}</p>
            {user.bio && <p style={{ margin: "0 0 8px", color: "var(--muted)" }}>{user.bio}</p>}
            {user.website && (
              <a href={user.website} target="_blank" rel="noreferrer" style={{ fontSize: "14px" }}>
                {user.website}
              </a>
            )}
            <div style={{ display: "flex", justifyContent: "center", gap: "32px", margin: "16px 0" }}>
              <div style={{ textAlign: "center" }}>
                <strong>{user.followersCount}</strong>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>Followers</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <strong>{user.followingCount}</strong>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>Following</p>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
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
            <textarea className="input-field" rows={3} maxLength={160} value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              style={{ resize: "none" }} />
            <p style={{ fontSize: "12px", color: "var(--muted)", margin: "-8px 0 8px", textAlign: "right" }}>
              {form.bio.length}/160
            </p>

            <label className="input-label">Website</label>
            <input className="input-field" type="url" placeholder="https://yoursite.com" value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })} />

            <label style={{ display: "flex", alignItems: "center", gap: "8px", margin: "8px 0", cursor: "pointer" }}>
              <input type="checkbox" checked={form.isPrivate}
                onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })} />
              <span className="input-label" style={{ margin: 0 }}>Private account</span>
            </label>

            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <button className="btn btn-primary" type="submit" disabled={isSubmitting} style={{ flex: 1 }}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
              <button type="button" onClick={() => { setIsEditing(false); setErrorMessage(""); setSuccessMessage(""); }}
                style={{ flex: 1, padding: "10px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "transparent", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* <p className="auth-switch" style={{ textAlign: "center", marginTop: "16px" }}>
          <a href="/dashboard">← Back to Dashboard</a>
        </p> */}
      </main>
    </div>
    </>
  );
}

export default Profile;