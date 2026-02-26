import { useState, useEffect, useRef } from "react";
import API from "../services/api";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Poll for unread count every 30 seconds
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { data } = await API.get("/notifications/unread-count");
        setUnreadCount(data.count);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openDropdown = async () => {
    setOpen((prev) => !prev);
    if (!open) {
      const { data } = await API.get("/notifications");
      setNotifications(data);
      // Mark all as read
      await API.patch("/notifications/read-all");
      setUnreadCount(0);
    }
  };

  const handleAccept = async (senderId, notifId) => {
    await API.patch(`/follow/${senderId}/accept`);
    setNotifications((prev) => prev.filter((n) => n._id !== notifId));
  };

  const handleReject = async (senderId, notifId) => {
    await API.delete(`/follow/${senderId}/reject`);
    setNotifications((prev) => prev.filter((n) => n._id !== notifId));
  };

  const getMessage = (n) => {
    const name = n.sender?.name || "Someone";
    switch (n.type) {
      case "follow_request":  return `${name} wants to follow you`;
      case "follow_accepted": return `${name} accepted your follow request`;
      case "new_follower":    return `${name} started following you`;
      case "message":         return `${name} sent you a message`;
      default:                return `New notification from ${name}`;
    }
  };

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <button onClick={openDropdown} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", fontSize: "1.4rem" }}>
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: "-6px", right: "-6px",
            background: "red", color: "white", borderRadius: "50%",
            fontSize: "0.65rem", padding: "2px 5px", fontWeight: "bold",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: "110%",
          background: "white", border: "1px solid #eee",
          borderRadius: "10px", width: "320px", boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          zIndex: 1000, maxHeight: "400px", overflowY: "auto",
        }}>
          <div style={{ padding: "12px 16px", fontWeight: "bold", borderBottom: "1px solid #f0f0f0" }}>
            Notifications
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#888" }}>No notifications</div>
          ) : (
            notifications.map((n) => (
              <div key={n._id} style={{
                padding: "12px 16px", borderBottom: "1px solid #f7f7f7",
                background: n.isRead ? "white" : "#f0f7ff",
                display: "flex", flexDirection: "column", gap: "8px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <img
                    src={n.sender?.avatar || "/default-avatar.png"}
                    alt="avatar"
                    style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }}
                  />
                  <div>
                    <p style={{ margin: 0, fontSize: "0.9rem" }}>{getMessage(n)}</p>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "#999" }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {n.type === "follow_request" && (
                  <div style={{ display: "flex", gap: "8px", paddingLeft: "46px" }}>
                    <button
                      onClick={() => handleAccept(n.sender._id, n._id)}
                      style={{ padding: "4px 14px", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(n.sender._id, n._id)}
                      style={{ padding: "4px 14px", background: "#f1f1f1", border: "none", borderRadius: "6px", cursor: "pointer" }}
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}