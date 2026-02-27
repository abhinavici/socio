import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const { data: profileData } = await API.get(`/users/${username}`);
        setUser(profileData);
        const { data: statusData } = await API.get(`/follow/${profileData._id}/status`);
        if (statusData.isFollowing)   setFollowState("following");
        else if (statusData.isPending) setFollowState("pending");
        else                           setFollowState("none");
      } catch (error) {
        setErrorMessage(getErrorMessage(error, "User not found."));
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  const handleMessage = async () => {
    try {
      const { data } = await API.post(`/messages/conversations/${user._id}`);
      navigate(`/messages/${data._id}`);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Cannot message this user");
    }
  };

  const handleFollow = async () => {
    try {
      setIsSubmitting(true);
      if (followState === "following") {
        await API.delete(`/follow/${user._id}`);
        setFollowState("none");
        setUser((prev) => ({ ...prev, followersCount: prev.followersCount - 1 }));
      } else if (followState === "pending") {
        await API.delete(`/follow/${user._id}`);
        setFollowState("none");
      } else {
        const { data } = await API.post(`/follow/${user._id}`);
        if (data.status === "pending") {
          setFollowState("pending");
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
          <p className="profile-loading">Loading...</p>
        </div>
      </>
    );
  }

  if (errorMessage) {
    return (
      <>
        <Navbar />
        <div className="auth-page">
          <p className="notice error error-centered">{errorMessage}</p>
        </div>
      </>
    );
  }

  const followBtnClass = followState === "following"
    ? "btn btn-primary follow-btn follow-btn--following"
    : followState === "pending"
    ? "btn btn-primary follow-btn follow-btn--pending"
    : "btn btn-primary follow-btn";

  return (
    <>
      <Navbar />
      <div className="auth-page">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />

        <main className="auth-card auth-card--wide">
          <div className="user-profile-center">
            <div className="avatar avatar--xl" style={{ marginBottom: "12px" }}>
              {user.avatar
                ? <img src={user.avatar} alt={user.name} />
                : <span className="avatar--initial">{user.name?.charAt(0).toUpperCase()}</span>
              }
            </div>

            <h2 className="profile-view__name">{user.name}</h2>
            <p className="profile-view__handle">@{user.username}</p>
            <p className="profile-view__user-id">{user.userId}</p>
            {user.bio     && <p className="profile-view__bio">{user.bio}</p>}
            {user.website && <a href={user.website} target="_blank" rel="noreferrer" className="profile-view__website" style={{ marginBottom: "8px" }}>{user.website}</a>}

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

            <div className="user-profile-actions">
              <button className={followBtnClass} onClick={handleFollow} disabled={isSubmitting}>
                {isSubmitting
                  ? "..."
                  : followState === "following"
                  ? "Unfollow"
                  : followState === "pending"
                  ? "Requested"
                  : "Follow"}
              </button>
              {followState === "following" && (
                <button className="btn message-btn" onClick={handleMessage}>
                  💬 Message
                </button>
              )}
            </div>
          </div>

          {user.isPrivate && followState !== "following" && (
            <div className="private-account-notice">
              🔒 This account is private. Follow to see their content.
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default UserProfile;
