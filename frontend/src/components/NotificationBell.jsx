import { useState, useEffect, useRef } from "react";
import API from "../services/api";
import { useSocketContext } from "../context/SocketContext";

export default function NotificationBell({ mobileNav = false }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  const { socket } = useSocketContext();
  useEffect(() => {
    if (!socket) return;
    socket.on("newNotification", () => setUnreadCount((prev) => prev + 1));
    return () => socket.off("newNotification");
  }, [socket]);

  // Close on outside click
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
    const next = !open;
    setOpen(next);
    if (next) {
      const { data } = await API.get("/notifications");
      setNotifications(data);
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
    <div
      className={mobileNav ? "mobile-nav__item mobile-nav__notif" : "notif-bell"}
      ref={dropdownRef}
    >
      <button
        onClick={openDropdown}
        className={mobileNav ? "mobile-nav__notif-btn" : "notif-bell__btn"}
      >
        {mobileNav ? (
          <>
            <span className="material-icons-round">notifications</span>
            <span className="mobile-nav__label">
              Alerts{unreadCount > 0 ? ` (${unreadCount > 9 ? "9+" : unreadCount})` : ""}
            </span>
          </>
        ) : (
          <>
            🔔
            {unreadCount > 0 && (
              <span className="notif-bell__badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
            )}
          </>
        )}
      </button>

      {open && (
        <div className={mobileNav ? "notif-dropdown notif-dropdown--mobile" : "notif-dropdown"}>
          <div className="notif-dropdown__header">Notifications</div>

          {notifications.length === 0 ? (
            <div className="notif-dropdown__empty">No notifications</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                className={`notif-item ${n.isRead ? "notif-item--read" : "notif-item--unread"}`}
              >
                <div className="notif-item__content">
                  <img
                    src={n.sender?.avatar || "/default-avatar.png"}
                    alt="avatar"
                    className="notif-item__avatar"
                  />
                  <div>
                    <p className="notif-item__message">{getMessage(n)}</p>
                    <p className="notif-item__time">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {n.type === "follow_request" && (
                  <div className="notif-item__actions">
                    <button className="notif-accept-btn" onClick={() => handleAccept(n.sender._id, n._id)}>
                      Accept
                    </button>
                    <button className="notif-decline-btn" onClick={() => handleReject(n.sender._id, n._id)}>
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
