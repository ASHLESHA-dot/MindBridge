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
  const [hasUpdatedToday, setHasUpdatedToday] = useState(false);
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [pendingMood, setPendingMood] = useState(null);
  const [userCircles, setUserCircles] = useState([]);
  const [selectedCircles, setSelectedCircles] = useState([]);
  const [visibilityStep, setVisibilityStep] = useState(1); // 1 = choose visibility, 2 = select circles
  
  const defaultAvatar = defaultAvatarr;

  useEffect(() => {
    fetchMoods();
    fetchRecommendedCircles();
    fetchFeed();
    fetchUserCircles();
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
      setHasUpdatedToday(!!todayEntry);
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

  const fetchUserCircles = async () => {
    try {
      const res = await api.get("/circles/joined");
      setUserCircles(res.data);
    } catch (err) {
      console.error("Error fetching user circles:", err);
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

  const handleMoodClick = (mood) => {
    if (todayMood) {
      // Already has a mood today - show error
      setError("You can only update your mood once per day. Your mood for today has already been recorded.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    // No mood yet today - show visibility modal
    setPendingMood(mood);
    setShowVisibilityModal(true);
  };

  const addMoodWithVisibility = async (visibility, selectedCircles = []) => {
    try {
      setError("");
      const payload = { 
        mood: pendingMood, 
        visibility,
        circles: visibility === "circles" ? selectedCircles : []
      };
      await api.post("/moods", payload);
      await fetchMoods();
      setShowVisibilityModal(false);
      setPendingMood(null);
    } catch (error) {
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Failed to update mood");
      }
      setShowVisibilityModal(false);
      setPendingMood(null);
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
      case "not_added": return "⚪";
      default: return "❓";
    }
  };

  const getMoodDisplay = (mood) => {
    switch(mood) {
      case "good": return "Good";
      case "neutral": return "Neutral";
      case "bad": return "Bad";
      case "not_added": return "Not Added";
      default: return "Unknown";
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
      
      {/* Visibility Modal */}
      {showVisibilityModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "12px",
            maxWidth: "500px",
            width: "90%",
            maxHeight: "80vh",
            overflowY: "auto"
          }}>
            {visibilityStep === 1 ? (
              // Step 1: Choose Visibility
              <>
                <h3 style={{ marginTop: 0 }}>Choose Visibility</h3>
                <p style={{ color: "#666", marginBottom: "20px" }}>
                  Who can see your mood for today?
                </p>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <button
                    onClick={() => {
                      setVisibilityStep(1);
                      addMoodWithVisibility("private");
                    }}
                    style={{
                      ...buttonStyle,
                      background: "#e3f2fd",
                      border: "2px solid #2196F3",
                      padding: "15px",
                      textAlign: "left"
                    }}
                  >
                    <strong>🔒 Private</strong>
                    <br />
                    <small style={{ color: "#666" }}>Only you can see this</small>
                  </button>
                  
                  <button
                    onClick={() => {
                      if (userCircles.length === 0) {
                        alert("You haven't joined any circles yet. Join circles to share your mood with them!");
                        return;
                      }
                      setVisibilityStep(2);
                    }}
                    style={{
                      ...buttonStyle,
                      background: "#f3e5f5",
                      border: "2px solid #9c27b0",
                      padding: "15px",
                      textAlign: "left"
                    }}
                  >
                    <strong>👥 Shared to Specific Circles</strong>
                    <br />
                    <small style={{ color: "#666" }}>Choose which circles can see this</small>
                  </button>
                  
                  <button
                    onClick={() => {
                      setVisibilityStep(1);
                      addMoodWithVisibility("public");
                    }}
                    style={{
                      ...buttonStyle,
                      background: "#e8f5e9",
                      border: "2px solid #4caf50",
                      padding: "15px",
                      textAlign: "left"
                    }}
                  >
                    <strong>🌍 Public</strong>
                    <br />
                    <small style={{ color: "#666" }}>Everyone can see this</small>
                  </button>
                </div>
                
                <button
                  onClick={() => {
                    setShowVisibilityModal(false);
                    setPendingMood(null);
                    setVisibilityStep(1);
                  }}
                  style={{
                    ...buttonStyle,
                    width: "100%",
                    marginTop: "15px",
                    background: "#f5f5f5"
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              // Step 2: Select Circles
              <>
                <h3 style={{ marginTop: 0 }}>Select Circles</h3>
                <p style={{ color: "#666", marginBottom: "20px" }}>
                  Choose which circles can see your mood
                </p>
                
                <div style={{ marginBottom: "20px" }}>
                  {userCircles.map(circle => (
                    <label
                      key={circle._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "12px",
                        marginBottom: "8px",
                        border: "2px solid",
                        borderColor: selectedCircles.includes(circle._id) ? "#9c27b0" : "#ddd",
                        borderRadius: "8px",
                        cursor: "pointer",
                        background: selectedCircles.includes(circle._id) ? "#f3e5f5" : "white"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCircles.includes(circle._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCircles([...selectedCircles, circle._id]);
                          } else {
                            setSelectedCircles(selectedCircles.filter(id => id !== circle._id));
                          }
                        }}
                        style={{ marginRight: "10px", width: "18px", height: "18px" }}
                      />
                      <div>
                        <strong>{circle.name}</strong>
                        <br />
                        <small style={{ color: "#666" }}>{circle.description}</small>
                      </div>
                    </label>
                  ))}
                </div>
                
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => {
                      if (selectedCircles.length === 0) {
                        alert("Please select at least one circle");
                        return;
                      }
                      addMoodWithVisibility("circles", selectedCircles);
                      setSelectedCircles([]);
                      setVisibilityStep(1);
                    }}
                    style={{
                      ...buttonStyle,
                      flex: 1,
                      background: "#9c27b0",
                      color: "white",
                      border: "none",
                      opacity: selectedCircles.length === 0 ? 0.5 : 1
                    }}
                    disabled={selectedCircles.length === 0}
                  >
                    Save ({selectedCircles.length} selected)
                  </button>
                  <button
                    onClick={() => {
                      setVisibilityStep(1);
                      setSelectedCircles([]);
                    }}
                    style={{
                      ...buttonStyle,
                      background: "#f5f5f5"
                    }}
                  >
                    Back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
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
        
        {/* Profile Actions */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => navigate("/profile")}
            style={{
              ...buttonStyle,
              background: "#007bff",
              color: "white",
              border: "none",
              display: "flex",
              alignItems: "center",
              gap: "5px"
            }}
          >
            ✏️ Edit Profile
          </button>
          <button
            onClick={handleLogout}
            style={{
              ...buttonStyle,
              background: "#dc3545",
              color: "white",
              border: "none",
              display: "flex",
              alignItems: "center",
              gap: "5px"
            }}
          >
            🚪 Logout
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
                  <strong>{getMoodDisplay(todayMood.mood).toUpperCase()}</strong>
                </p>
                <p style={{ color: todayMood.mood === "not_added" ? "#d9480f" : "#2f9e44", marginBottom: "10px" }}>
                  {todayMood.mood === "not_added" ? "⚠️ Auto-filled as Not Added" : "✓ Mood recorded for today"}
                </p>
                <p style={{ fontSize: "12px", color: "#999" }}>
                  Visibility: {todayMood.visibility === "private" ? "🔒 Private" : 
                               todayMood.visibility === "circles" ? `👥 Specific Circles (${todayMood.circles?.length || 0})` : 
                               "🌍 Public"}
                </p>
                {todayMood.visibility === "circles" && todayMood.circles && todayMood.circles.length > 0 && (
                  <div style={{ fontSize: "11px", color: "#666", marginTop: "5px" }}>
                    Shared with: {todayMood.circles.map(c => c.name || "Unknown").join(", ")}
                  </div>
                )}
                <p style={{ fontSize: "12px", color: "#999", fontStyle: "italic", marginTop: "10px" }}>
                  Note: You can only update your mood once per day
                </p>
              </>
            ) : (
              <p style={{ color: "#d9480f" }}>
                ⚠️ You haven't logged today's mood yet. Fill it now or it will be auto-filled as "Not Added" at midnight.
              </p>
            )}

            <div style={{ marginTop: "15px" }}>
              <button 
                style={{
                  ...buttonStyle,
                  opacity: todayMood ? 0.5 : 1,
                  cursor: todayMood ? "not-allowed" : "pointer"
                }} 
                onClick={() => handleMoodClick("good")}
                disabled={!!todayMood}
              >
                😊 Good
              </button>{" "}
              <button 
                style={{
                  ...buttonStyle,
                  opacity: todayMood ? 0.5 : 1,
                  cursor: todayMood ? "not-allowed" : "pointer"
                }} 
                onClick={() => handleMoodClick("neutral")}
                disabled={!!todayMood}
              >
                😐 Neutral
              </button>{" "}
              <button 
                style={{
                  ...buttonStyle,
                  opacity: todayMood ? 0.5 : 1,
                  cursor: todayMood ? "not-allowed" : "pointer"
                }} 
                onClick={() => handleMoodClick("bad")}
                disabled={!!todayMood}
              >
                😔 Bad
              </button>
            </div>

            {error && (
              <div style={{ 
                marginTop: "15px",
                padding: "10px",
                backgroundColor: "#ffebee",
                borderLeft: "4px solid #f44336",
                borderRadius: "4px",
                color: "#c62828"
              }}>
                {error}
              </div>
            )}
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
                {new Date(m.date).toDateString()} — {getMoodEmoji(m.mood)} {getMoodDisplay(m.mood)}
                {" "}
                <span style={{ fontSize: "12px", color: "#999" }}>
                  ({m.visibility === "private" ? "🔒" : 
                    m.visibility === "circles" ? `👥 (${m.circles?.length || 0} circles)` : 
                    "🌍"})
                </span>
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