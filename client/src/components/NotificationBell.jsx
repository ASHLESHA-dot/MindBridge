// components/NotificationBell.jsx
import { useState, useEffect } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.read).length);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      fetchNotifications();
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);
    if (notification.link) {
      navigate(notification.link);
    }
    setShowDropdown(false);
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          position: "relative",
          padding: "12px 14px",
          fontSize: "18px",
          cursor: "pointer",
          background: "rgba(255,255,255,0.7)",
          border: "1px solid rgba(124, 111, 246, 0.16)",
          borderRadius: "16px",
          boxShadow: "0 12px 26px rgba(124, 111, 246, 0.12)"
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-5px",
              right: "-5px",
              backgroundColor: "red",
              color: "white",
              borderRadius: "50%",
              padding: "2px 6px",
              fontSize: "12px",
              fontWeight: "bold"
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "45px",
            width: "350px",
            maxHeight: "400px",
            overflowY: "auto",
            backgroundColor: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(255,255,255,0.9)",
            borderRadius: "18px",
            boxShadow: "0 24px 40px rgba(15, 23, 42, 0.18)",
            backdropFilter: "blur(18px)",
            zIndex: 1000
          }}
        >
          <div style={{ padding: "10px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} style={{ fontSize: "12px", padding: "2px 8px" }}>
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p style={{ padding: "15px", textAlign: "center", color: "#999" }}>
              No notifications
            </p>
          ) : (
            notifications.map(notif => (
              <div
  key={notif._id}
  onClick={() => handleNotificationClick(notif)}
  style={{
    padding: "12px",
    borderBottom: "1px solid #eee",
    cursor: "pointer",
    backgroundColor: notif.read ? "white" : "#f0f8ff",
    whiteSpace: "normal",
    wordBreak: "break-word",
    lineHeight: "1.4"
  }}
>
   <p
  style={{
    margin: 0,
    fontSize: "14px",
    fontWeight: notif.read ? "400" : "600",
    whiteSpace: "normal",
    wordBreak: "break-word",
    lineHeight: "1.4"
  }}
>
  {notif.message || "🔔 You have a new notification"}
</p>


                <small style={{ color: "#999" }}>
  {new Date(notif.createdAt).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  })}
</small>

              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}