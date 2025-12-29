import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../assets/default-avatar.png";

export default function Profile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setBio(user.bio || "");
      setInterests(user.interests?.join(", ") || "");
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put("/auth/profile", {
        displayName,
        bio,
        interests: interests.split(",").map(i => i.trim()).filter(Boolean)
      });
      
      setUser(res.data);
localStorage.setItem("user", JSON.stringify(res.data));
      alert("Profile updated successfully!");
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update profile");
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: "20px" }}>
      <h2>Edit Profile</h2>
      <img
  src={user?.avatar || defaultAvatar}
  alt="avatar"
  style={{
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    marginBottom: "15px"
  }}
/>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label>Display Name:</label>
          <input
            style={{ width: "100%", padding: "8px" }}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Bio:</label>
          <textarea
            style={{ width: "100%", padding: "8px", minHeight: "100px" }}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Interests (comma-separated):</label>
          <input
            style={{ width: "100%", padding: "8px" }}
            placeholder="anxiety, mindfulness, productivity"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
          />
        </div>

        <button type="submit">Save Profile</button>
        <button type="button" onClick={() => navigate("/")} style={{ marginLeft: "10px" }}>
          Cancel
        </button>
      </form>
    </div>
  );
}