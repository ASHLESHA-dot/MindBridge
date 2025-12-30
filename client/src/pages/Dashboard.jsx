import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Navbar from "../components/Navbar";
import defaultAvatarr from "../assets/default-avatar.png";

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

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [moods, setMoods] = useState([]);
  const [todayMood, setTodayMood] = useState(null);
  const [recommendedCircles, setRecommendedCircles] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [error, setError] = useState("");
  
  const defaultAvatar = defaultAvatarr;

  useEffect(() => {
    fetchMoods();
    fetchRecommendedCircles();
    fetchFeed();
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
      
      if (user?.interests && user.interests.length > 0) {
        const filtered = res.data.filter(circle => 
          circle.tags?.some(tag => 
            user.interests.some(interest => 
              tag.toLowerCase().includes(interest.toLowerCase()) ||
              interest.toLowerCase().includes(tag.toLowerCase())
            )
          )
        );
        setRecommendedCircles(filtered.slice(0, 3));
      } else {
        setRecommendedCircles(res.data.slice(0, 3));
      }
    } catch (err) {
      console.error("Error fetching circles:", err);
    }
  };

  const fetchFeed = async () => {
    try {
      setLoadingFeed(true);
      const res = await api.get("/feed");
      setFeedPosts(res.data);
    } catch (err) {
      console.error("Error fetching feed:", err);
    } finally {
      setLoadingFeed(false);
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

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
      <Navbar/>
      
      {/* Header with Profile Picture */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "30px",
        padding: "15px",
        backgroundColor: "#f9f9f9",
        borderRadius: "8px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <img
            src={user?.profilePicture || defaultAvatar}
            alt="Profile"
            crossOrigin="anonymous"
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #ddd",
              cursor: "pointer"
            }}
            onClick={() => navigate("/profile")}
            title="Click to edit profile"
          />
          <div>
            <h1 style={{ margin: 0 }}>Welcome, {user?.displayName || user?.username}</h1>
            <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "14px" }}>
              {user?.bio || "No bio yet"}
            </p>
          </div>
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
                ⚠️ You haven't logged today's mood
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
            <div style={{ ...cardStyle, cursor: "pointer" }} onClick={() => navigate("/circles")}>
              🔵 <strong>Browse Circles</strong>
            </div>
            <div style={{ ...cardStyle, cursor: "pointer" }} onClick={() => navigate("/journals")}>
              📔 <strong>My Journals</strong>
            </div>
            <div style={{ ...cardStyle, cursor: "pointer" }} onClick={() => navigate("/journals/new")}>
              ✍️ <strong>New Journal</strong>
            </div>
          </div>

          {/* FEED FROM JOINED CIRCLES */}
          <div style={cardStyle}>
            <h2>🔄 Updates from Your Circles</h2>
            
            {loadingFeed ? (
              <p style={{ color: "#666", textAlign: "center", padding: "20px" }}>
                Loading feed...
              </p>
            ) : feedPosts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px", color: "#666" }}>
                <p style={{ fontSize: "18px", marginBottom: "10px" }}>📭 No posts yet</p>
                <p style={{ fontSize: "14px" }}>
                  Join some circles to see updates here!
                </p>
                <button 
                  style={{ ...buttonStyle, marginTop: "15px", background: "#007bff", color: "white", border: "none" }}
                  onClick={() => navigate("/circles")}
                >
                  Browse Circles
                </button>
              </div>
            ) : (
              <div>
                {feedPosts.map(post => (
                  <div
                    key={post._id}
                    style={{
                      borderBottom: "1px solid #eee",
                      padding: "15px 0",
                      cursor: "pointer"
                    }}
                    onClick={() => navigate(`/circles/${post.circle._id}`)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <img
                        src={post.author?.profilePicture || defaultAvatar}
                        alt={post.author?.username}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          objectFit: "cover"
                        }}
                      />
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <strong style={{ fontSize: "14px" }}>
                            {post.author?.displayName || post.author?.username}
                          </strong>
                          <span style={{ fontSize: "12px", color: "#999" }}>
                            in
                          </span>
                          <span style={{ 
                            fontSize: "12px", 
                            color: "#007bff",
                            fontWeight: "500"
                          }}>
                            {post.circle?.name}
                          </span>
                        </div>
                        <span style={{ fontSize: "12px", color: "#999" }}>
                          {getTimeAgo(post.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    <h4 style={{ margin: "8px 0 5px 0", fontSize: "16px" }}>
                      {post.title}
                    </h4>
                    <p style={{ 
                      margin: 0, 
                      color: "#666", 
                      fontSize: "14px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical"
                    }}>
                      {post.content}
                    </p>
                  </div>
                ))}
                
                {feedPosts.length >= 10 && (
                  <button 
                    style={{ ...buttonStyle, width: "100%", marginTop: "15px" }}
                    onClick={() => navigate("/circles")}
                  >
                    View All Circles
                  </button>
                )}
              </div>
            )}
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
                  <p style={{ fontSize: "14px", color: "#666", margin: "5px 0 0 0" }}>
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
            {moods.slice(0, 7).map(m => (
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