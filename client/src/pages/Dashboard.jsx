const cardStyle = {
  background: "#fff",
  borderRadius: "12px",
  padding: "20px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
};

const buttonStyle = {
  padding: "10px 16px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  background: "#f7f7f7",
  cursor: "pointer",
};

// Update Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Navbar from "../components/Navbar";
import defaultAvatar from "../assets/default-avatar.png";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [moods, setMoods] = useState([]);
  const [todayMood, setTodayMood] = useState(null);
  const [recommendedCircles, setRecommendedCircles] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMoods();
    fetchRecommendedCircles();
  }, []);

  const fetchMoods = async () => {
    try {
      const res = await api.get("/moods");
      setMoods(res.data);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayEntry = res.data.find(m => {
        const moodDate = new Date(m.date);
        moodDate.setHours(0, 0, 0, 0);
        return moodDate.getTime() === today.getTime();
      });
      
      setTodayMood(todayEntry);
    } catch (err) {
      console.error("Error fetching moods:", err);
    }
  };

  const fetchRecommendedCircles = async () => {
    try {
      const res = await api.get("/circles");
      
      // Filter circles based on user interests
      if (user?.interests && user.interests.length > 0) {
        const filtered = res.data.filter(circle => 
          circle.tags?.some(tag => 
            user.interests.some(interest => 
              tag.toLowerCase().includes(interest.toLowerCase()) ||
              interest.toLowerCase().includes(tag.toLowerCase())
            )
          )
        );
        setRecommendedCircles(filtered.slice(0, 3)); // Top 3
      } else {
        setRecommendedCircles(res.data.slice(0, 3)); // Just show first 3
      }
    } catch (err) {
      console.error("Error fetching circles:", err);
    }
  };

  const addOrUpdateMood = async (mood, visibility = "private") => {
    try {
      setError("");
      await api.post("/moods", { mood, visibility });
      await fetchMoods();
    } catch (error) {
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Failed to update mood");
      }
    }
  };

  const handleLogout = () => {
    if(confirm("Are you sure you want to log out?")) {
      logout();
      navigate("/login");
    }
  };

  const getMoodEmoji = (mood) => {
    switch(mood) {
      case "good": return "😊";
      case "neutral": return "😐";
      case "bad": return "😔";
      default: return "❓";
    }
  };

  const canEditToday = todayMood && !todayMood.isUpdated;

  return (
  <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
    <Navbar/>
    {/* Header */}
    <div style={{ 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center",
      marginBottom: "30px"
    }}>  <img
      src={user?.avatar || defaultAvatar}
      alt="avatar"
      style={{
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        objectFit: "cover",
        border: "1px solid #ddd"
      }}
    />
      <h1 style={{ margin: 0 }}>
        Welcome, {user?.displayName || user?.username} 
      </h1>
      <div>
        <button 
          style={{ ...buttonStyle, marginRight: "10px" }}
          onClick={() => navigate("/profile")}
        >
          Edit Profile
        </button>
        <button style={buttonStyle} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>

    {/* Main Grid */}
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
      
      {/* LEFT COLUMN */}
      <div>
        {/* Today's Mood */}
        <div style={{ ...cardStyle, marginBottom: "20px" }}>
          <h2>📅 Today's Mood</h2>

          {todayMood ? (
            <>
              <p style={{ fontSize: "26px", margin: "10px 0" }}>
                {getMoodEmoji(todayMood.mood)}{" "}
                <strong>{todayMood.mood.toUpperCase()}</strong>
              </p>
              <p style={{ color: "#2f9e44" }}>
                You can still update once
              </p>
            </>
          ) : (
            <p style={{ color: "#d9480f" }}>
              ⚠️ You haven’t logged today’s mood
            </p>
          )}

          <div style={{ marginTop: "15px" }}>
            <button style={buttonStyle} onClick={() => addOrUpdateMood("good")}>
              😊 Good
            </button>{" "}
            <button style={buttonStyle} onClick={() => addOrUpdateMood("neutral")}>
              😐 Neutral
            </button>{" "}
            <button style={buttonStyle} onClick={() => addOrUpdateMood("bad")}>
              😔 Bad
            </button>
          </div>

          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>

        {/* Quick Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          <div style={cardStyle} onClick={() => navigate("/circles")}>
            🔵 <strong>Browse Circles</strong>
          </div>
          <div style={cardStyle} onClick={() => navigate("/journals")}>
            📔 <strong>My Journals</strong>
          </div>
          <div style={cardStyle} onClick={() => navigate("/journals/new")}>
            ✍️ <strong>New Journal</strong>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <div>
        <div style={cardStyle}>
          <h3>✨ Recommended Circles</h3>

          {recommendedCircles.length > 0 ? (
            recommendedCircles.map(circle => (
              <div
                key={circle._id}
                style={{
                  borderBottom: "1px solid #eee",
                  padding: "10px 0",
                  cursor: "pointer"
                }}
                onClick={() => navigate(`/circles/${circle._id}`)}
              >
                <strong>{circle.name}</strong>
                <p style={{ fontSize: "14px", color: "#666" }}>
                  {circle.description}
                </p>
              </div>
            ))
          ) : (
            <p>No recommendations yet</p>
          )}

          <button 
            style={{ ...buttonStyle, width: "100%", marginTop: "10px" }}
            onClick={() => navigate("/circles")}
          >
            View All Circles
          </button>
        </div>
      </div>
    </div>

    {/* Mood History */}
    <div style={{ ...cardStyle, marginTop: "30px" }}>
      <h3>📊 Mood History</h3>
      {moods.length > 0 ? (
        <ul>
          {moods.map(m => (
            <li key={m._id}>
              {new Date(m.date).toDateString()} — {getMoodEmoji(m.mood)} {m.mood}
            </li>
          ))}
        </ul>
      ) : (
        <p>No mood history yet</p>
      )}
    </div>
  </div>
);

};
export default Dashboard;