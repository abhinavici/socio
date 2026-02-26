import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";
import { getErrorMessage } from "../utils/http";
import Navbar from "../components/Navbar";

function UserProfile() {
  const { username } = useParams();
  const [user, setUser] = useState(null);
const [followState, setFollowState] = useState("none"); 
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);

        // Get user profile by username
        const { data: profileData } = await API.get(`/users/${username}`);
        setUser(profileData);

        // Check if I am already following this user
        const { data: statusData } = await API.get(`/follow/${profileData._id}/status`);
        if (statusData.isFollowing) setFollowState("following");
        else if (statusData.isPending) setFollowState("pending");
        else setFollowState("none");

      } catch (error) {
        setErrorMessage(getErrorMessage(error, "User not found."));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

const handleFollow = async () => {
  try {
    setIsSubmitting(true);
    if (followState === "following") {
      await API.delete(`/follow/${user._id}`);
      setFollowState("none");
      setUser((prev) => ({ ...prev, followersCount: prev.followersCount - 1 }));
    } else if (followState === "pending") {
      // Cancel the follow request
      await API.delete(`/follow/${user._id}`);
      setFollowState("none");
    } else {
      const { data } = await API.post(`/follow/${user._id}`);
      if (data.status === "pending") {
        setFollowState("pending");
        // Don't increment count yet — not accepted
      } else {
        setFollowState("following");
        setUser((prev) => ({ ...prev, followersCount: prev.followersCount + 1 }));
      }
    }
  } catch (error) {
    setErrorMessage(getErrorMessage(error, "Action failed. Please try again."));
  } finally {
    setIsSubmitting(false);
  }
};

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="auth-page">
          <p style={{ textAlign: "center", marginTop: "40vh" }}>Loading...</p>
        </div>
      </>
    );
  }

  if (errorMessage) {
    return (
      <>
        <Navbar />
        <div className="auth-page">
          <p className="notice error" style={{ maxWidth: 400, margin: "40vh auto 0" }}>{errorMessage}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="auth-page">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />

        <main className="auth-card" style={{ maxWidth: "520px" }}>

          {/* Avatar */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ width: 100, height: 100, borderRadius: "50%", background: "var(--mint)", overflow: "hidden", border: "3px solid var(--sea)", marginBottom: "12px" }}>
              {user.avatar
                ? <img src={user.avatar} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, color: "var(--sea)", fontWeight: 700 }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
              }
            </div>

            {/* Name & Username */}
            <h2 style={{ margin: "0 0 4px", fontSize: "22px" }}>{user.name}</h2>
            <p style={{ margin: "0 0 8px", color: "var(--sea)" }}>@{user.username}</p>
            <p style={{ margin: "0 0 4px", fontSize: "12px", color: "var(--muted)" }}>{user.userId}</p>

            {/* Bio */}
            {user.bio && (
              <p style={{ margin: "8px 0", color: "var(--muted)", textAlign: "center" }}>{user.bio}</p>
            )}

            {/* Website */}
            {user.website && (
              <a href={user.website} target="_blank" rel="noreferrer" style={{ fontSize: "14px", marginBottom: "8px" }}>
                {user.website}
              </a>
            )}

            {/* Followers / Following */}
            <div style={{ display: "flex", gap: "32px", margin: "16px 0" }}>
              <div style={{ textAlign: "center" }}>
                <strong>{user.followersCount}</strong>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>Followers</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <strong>{user.followingCount}</strong>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>Following</p>
              </div>
            </div>

            {/* Follow / Unfollow Button */}
            <button
              className="btn btn-primary"
              onClick={handleFollow}
              disabled={isSubmitting}
              style={{
                background: followState !== "none" ? "transparent" : "",
                color: followState !== "none" ? "var(--sea)" : "",
                border: followState !== "none" ? "1px solid var(--sea)" : "",
                minWidth: "140px"
              }}
            >
              {isSubmitting 
              ? "..." 
              : followState === "following" 
              ? "Unfollow" 
              : followState === "pending" 
              ? "Requested"
              : "Follow"}
            </button>
          </div>

          {/* Private account message */}
          {user.isPrivate && followState !== "following" && (
            <div style={{ textAlign: "center", padding: "20px", border: "1px dashed var(--border)", borderRadius: "var(--radius-md)", color: "var(--muted)" }}>
              🔒 This account is private. Follow to see their content.
            </div>
          )}

        </main>
      </div>
    </>
  );
}

export default UserProfile;