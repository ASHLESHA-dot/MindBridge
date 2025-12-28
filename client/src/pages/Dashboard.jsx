import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [moods, setMoods] = useState([]);
  const [todayMood, setTodayMood] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMoods();
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

  const addOrUpdateMood = async (mood, visibility = "private") => {
    try {
      setError(""); // Clear previous errors
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
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Welcome, {user?.username}</h1>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <hr />

      <h2>📅 Today's Mood</h2>
      {todayMood ? (
        <div style={{ backgroundColor: "#f0f0f0", padding: "15px", borderRadius: "8px" }}>
          <p style={{ fontSize: "24px", margin: "10px 0" }}>
            {getMoodEmoji(todayMood.mood)} {todayMood.mood.toUpperCase()}
          </p>
          <p style={{ fontSize: "14px", color: "#666", margin: "5px 0" }}>
            Visibility: {todayMood.visibility}
          </p>
          {todayMood.isUpdated ? (
            <p style={{ fontSize: "12px", color: "#ff6b6b", marginTop: "10px" }}>
              ℹ️ You have already updated today's mood. Come back tomorrow!
            </p>
          ) : (
            <p style={{ fontSize: "12px", color: "#51cf66", marginTop: "10px" }}>
              ✏️ You can still update today's mood once
            </p>
          )}
        </div>
      ) : (
        <div style={{ backgroundColor: "#fff3cd", padding: "15px", borderRadius: "8px" }}>
          <p style={{ color: "#856404" }}>⚠️ You haven't logged your mood today!</p>
        </div>
      )}

      {error && (
        <div style={{ backgroundColor: "#f8d7da", color: "#721c24", padding: "10px", borderRadius: "5px", margin: "10px 0" }}>
          {error}
        </div>
      )}

      <div style={{ margin: "20px 0" }}>
        <h3>{todayMood ? "Update Today's Mood:" : "Log Today's Mood:"}</h3>
        {(!todayMood || canEditToday) ? (
          <div>
            <button 
              onClick={() => addOrUpdateMood("good", "private")} 
              style={{ margin: "5px", padding: "10px 20px", cursor: "pointer" }}
            >
              Good 😊
            </button>
            <button 
              onClick={() => addOrUpdateMood("neutral", "private")} 
              style={{ margin: "5px", padding: "10px 20px", cursor: "pointer" }}
            >
              Neutral 😐
            </button>
            <button 
              onClick={() => addOrUpdateMood("bad", "private")} 
              style={{ margin: "5px", padding: "10px 20px", cursor: "pointer" }}
            >
              Bad 😔
            </button>
          </div>
        ) : (
          <p style={{ color: "#999", fontStyle: "italic" }}>
            Mood buttons are disabled. You've already updated today's mood.
          </p>
        )}
      </div>

      <hr />

      <h2>📊 Mood History</h2>
      {moods.length > 0 ? (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #ddd" }}>
              <th style={{ padding: "10px", textAlign: "left" }}>Date</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Mood</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Visibility</th>
            </tr>
          </thead>
          <tbody>
            {moods.map((moodEntry) => (
              <tr key={moodEntry._id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px" }}>
                  {new Date(moodEntry.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                  })}
                </td>
                <td style={{ padding: "10px" }}>
                  {getMoodEmoji(moodEntry.mood)} {moodEntry.mood}
                </td>
                <td style={{ padding: "10px" }}>
                  {moodEntry.visibility}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No mood history yet. Start logging your moods!</p>
      )}
    </div>
  );
};

export default Dashboard;