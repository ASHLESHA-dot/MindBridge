// components/Navbar.jsx
import NotificationBell from "./NotificationBell";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 20px",
      borderBottom: "1px solid #eee",
      background: "#fff",
      position: "sticky",
      top: 0,
      zIndex: 2000
    }}>
      <h2 style={{ margin: 0, cursor: "pointer" }} onClick={() => navigate("/")}>
        MindBridge
      </h2>

      <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
        <NotificationBell />
       
      </div>
    </div>
  );
}
