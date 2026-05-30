import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import NotificationBell from "../components/NotificationBell";
import defaultAvatarr from "../assets/default-avatar.png";
import "../styles/dashboard.css";

const moodOptions = [
  { key: "good", label: "Good", emoji: "😊", tone: "#22C55E" },
  { key: "neutral", label: "Neutral", emoji: "😐", tone: "#A78BFA" },
  { key: "bad", label: "Bad", emoji: "😔", tone: "#F472B6" },
];

const sidebarLinks = [
  { label: "Overview", icon: "✨", to: "/" },
  { label: "Circles", icon: "◌", to: "/circles" },
  { label: "Journals", icon: "📔", to: "/journals" },
  { label: "New Journal", icon: "✍️", to: "/journals/new" },
  { label: "Profile", icon: "👤", to: "/profile" },
];

const quickActions = [
  { label: "Browse Circles", icon: "◌", to: "/circles", accent: "linear-gradient(135deg, rgba(124,111,246,.18), rgba(167,139,250,.18))" },
  { label: "My Journals", icon: "📔", to: "/journals", accent: "linear-gradient(135deg, rgba(244,114,182,.16), rgba(255,255,255,.6))" },
  { label: "New Journal", icon: "✍️", to: "/journals/new", accent: "linear-gradient(135deg, rgba(34,197,94,.14), rgba(255,255,255,.6))" },
];

const buttonStyle = {
  padding: "10px 16px",
  borderRadius: "14px",
  border: "1px solid rgba(124, 111, 246, 0.16)",
  background: "rgba(255,255,255,0.72)",
  cursor: "pointer",
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [moods, setMoods] = useState([]);
  const [todayMood, setTodayMood] = useState(null);
  const [recommendedCircles, setRecommendedCircles] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [userJournals, setUserJournals] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingJournals, setLoadingJournals] = useState(true);
  const [error, setError] = useState("");
  const [hasUpdatedToday, setHasUpdatedToday] = useState(false);
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [pendingMood, setPendingMood] = useState(null);
  const [userCircles, setUserCircles] = useState([]);
  const [selectedCircles, setSelectedCircles] = useState([]);
  const [visibilityStep, setVisibilityStep] = useState(1);

  const defaultAvatar = defaultAvatarr;

  useEffect(() => {
    fetchMoods();
    fetchRecommendedCircles();
    fetchFeed();
    fetchUserCircles();
    fetchUserJournals();
  }, []);

  const fetchMoods = async () => {
    try {
      const res = await api.get("/moods");
      setMoods(res.data);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayEntry = res.data.find((m) => {
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
        const filtered = res.data.filter((circle) =>
          circle.tags?.some((tag) =>
            user.interests.some(
              (interest) =>
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

  const fetchUserJournals = async () => {
    try {
      setLoadingJournals(true);
      const res = await api.get("/journals");
      setUserJournals(res.data);
    } catch (err) {
      console.error("Error fetching journals:", err);
    } finally {
      setLoadingJournals(false);
    }
  };

  const handleMoodClick = (mood) => {
    if (todayMood) {
      setError("You can only update your mood once per day. Your mood for today has already been recorded.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setPendingMood(mood);
    setShowVisibilityModal(true);
  };

  const addMoodWithVisibility = async (visibility, selectedCircleIds = []) => {
    try {
      setError("");
      const payload = {
        mood: pendingMood,
        visibility,
        circles: visibility === "circles" ? selectedCircleIds : [],
      };

      await api.post("/moods", payload);
      await fetchMoods();
      setShowVisibilityModal(false);
      setPendingMood(null);
      setSelectedCircles([]);
      setVisibilityStep(1);
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
    if (confirm("Are you sure you want to log out?")) {
      logout();
      navigate("/login");
    }
  };

  const getMoodEmoji = (mood) => {
    switch (mood) {
      case "good":
        return "😊";
      case "neutral":
        return "😐";
      case "bad":
        return "😔";
      case "not_added":
        return "⚪";
      default:
        return "❓";
    }
  };

  const getMoodDisplay = (mood) => {
    switch (mood) {
      case "good":
        return "Good";
      case "neutral":
        return "Neutral";
      case "bad":
        return "Bad";
      case "not_added":
        return "Not Added";
      default:
        return "Unknown";
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

  const moodCounts = useMemo(() => {
    const counts = { good: 0, neutral: 0, bad: 0, not_added: 0 };
    moods.forEach((mood) => {
      if (counts[mood.mood] !== undefined) {
        counts[mood.mood] += 1;
      }
    });
    return counts;
  }, [moods]);

  const totalMoodEntries = moods.length || 1;
  const moodSummary = [
    { key: "good", label: "Good", count: moodCounts.good, color: "#22C55E" },
    { key: "neutral", label: "Neutral", count: moodCounts.neutral, color: "#A78BFA" },
    { key: "bad", label: "Bad", count: moodCounts.bad, color: "#F472B6" },
    { key: "not_added", label: "Not Added", count: moodCounts.not_added, color: "#94A3B8" },
  ];

  const joinedCirclesCount = userCircles.length;

  return (
    <div className="dashboard-shell">
      <div className="dashboard-blobs" aria-hidden="true">
        <span className="dashboard-blob one" />
        <span className="dashboard-blob two" />
        <span className="dashboard-blob three" />
      </div>

      {showVisibilityModal && (
        <div className="dashboard-modal-backdrop">
          <div className="dashboard-modal">
            {visibilityStep === 1 ? (
              <>
                <h3>Choose Visibility</h3>
                <p style={{ color: "#64748b", marginBottom: 20 }}>
                  Who can see your mood for today?
                </p>

                <div className="dashboard-visibility-options">
                  <button
                    onClick={() => addMoodWithVisibility("private")}
                    className="dashboard-visibility-option"
                  >
                    <strong>🔒 Private</strong>
                    <br />
                    <small style={{ color: "#64748b" }}>Only you can see this</small>
                  </button>

                  <button
                    onClick={() => {
                      if (userCircles.length === 0) {
                        alert("You haven't joined any circles yet. Join circles to share your mood with them!");
                        return;
                      }
                      setVisibilityStep(2);
                    }}
                    className="dashboard-visibility-option"
                  >
                    <strong>👥 Specific Circles</strong>
                    <br />
                    <small style={{ color: "#64748b" }}>Choose which circles can see this</small>
                  </button>

                  <button
                    onClick={() => addMoodWithVisibility("public")}
                    className="dashboard-visibility-option"
                  >
                    <strong>🌍 Public</strong>
                    <br />
                    <small style={{ color: "#64748b" }}>Everyone can see this</small>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setShowVisibilityModal(false);
                    setPendingMood(null);
                    setVisibilityStep(1);
                  }}
                  style={{ ...buttonStyle, width: "100%", marginTop: 16 }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <h3>Select Circles</h3>
                <p style={{ color: "#64748b", marginBottom: 20 }}>
                  Choose which circles can see your mood
                </p>

                <div style={{ marginBottom: 20, display: "grid", gap: 10 }}>
                  {userCircles.map((circle) => (
                    <label
                      key={circle._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: 12,
                        border: "1px solid rgba(124, 111, 246, 0.16)",
                        borderRadius: 16,
                        cursor: "pointer",
                        background: selectedCircles.includes(circle._id) ? "rgba(167, 139, 250, 0.12)" : "rgba(255,255,255,0.78)",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCircles.includes(circle._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCircles([...selectedCircles, circle._id]);
                          } else {
                            setSelectedCircles(selectedCircles.filter((id) => id !== circle._id));
                          }
                        }}
                        style={{ marginRight: 10, width: 18, height: 18 }}
                      />
                      <div>
                        <strong>{circle.name}</strong>
                        <br />
                        <small style={{ color: "#64748b" }}>{circle.description}</small>
                      </div>
                    </label>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    onClick={() => {
                      if (selectedCircles.length === 0) {
                        alert("Please select at least one circle");
                        return;
                      }
                      addMoodWithVisibility("circles", selectedCircles);
                    }}
                    style={{
                      ...buttonStyle,
                      flex: 1,
                      background: "linear-gradient(135deg, #7c6ff6, #f472b6)",
                      color: "white",
                      border: "none",
                      opacity: selectedCircles.length === 0 ? 0.5 : 1,
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
                    style={{ ...buttonStyle, background: "rgba(255,255,255,0.78)" }}
                  >
                    Back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <div className="dashboard-brand" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            <div className="dashboard-brand-mark">M</div>
            <div>
              <h1>MindBridge</h1>
              <p>Wellness-first community</p>
            </div>
          </div>

          <nav className="dashboard-nav" aria-label="Dashboard navigation">
            {sidebarLinks.map((item) => (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className={location.pathname === item.to ? "active" : ""}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="dashboard-sidebar-card">
            <h3>Wellness reminder</h3>
            <p>
              Take one small action today: drink water, breathe deeply, and check in with your mood before work.
            </p>
          </div>
        </aside>

        <main className="dashboard-main">
          <header className="dashboard-header">
            <div className="dashboard-greeting">
              <span className="eyebrow">🌿 Calm focus · Daily check-in</span>
              <h2>Welcome back, {user?.displayName || user?.username}</h2>
              <p>{user?.bio || "No bio yet"}</p>
            </div>

            <div className="dashboard-header-actions">
              <div className="dashboard-profile-chip" role="button" tabIndex={0} onClick={() => navigate("/profile")}
              >
                <img
                  src={user?.profilePicture || defaultAvatar}
                  alt="Profile"
                  crossOrigin="anonymous"
                />
                <div>
                  <strong>{user?.displayName || user?.username}</strong>
                  <span>{joinedCirclesCount} circles joined</span>
                </div>
              </div>

              <NotificationBell />

              <button onClick={handleLogout} className="dashboard-action-button">
                Logout
              </button>
            </div>
          </header>

          <div className="dashboard-stat-grid" style={{ marginBottom: 22 }}>
            <div className="dashboard-stat">
              <strong>{todayMood ? getMoodDisplay(todayMood.mood) : "Pending"}</strong>
              <span>Today's mood status</span>
            </div>
            <div className="dashboard-stat">
              <strong>{joinedCirclesCount}</strong>
              <span>Joined circles</span>
            </div>
            <div className="dashboard-stat">
              <strong>{userJournals.length}</strong>
              <span>Journals</span>
            </div>
            <div className="dashboard-stat">
              <strong>{feedPosts.length}</strong>
              <span>Recent posts</span>
            </div>
          </div>

          <div className="dashboard-grid">
            <section className="dashboard-stack">
              <div className="dashboard-card">
                <div className="dashboard-card-header">
                  <div className="dashboard-card-title">
                    <span className="label">Today's Mood</span>
                    <h3>Check in with yourself</h3>
                  </div>
                  <div className="dashboard-mood-badge">
                    <div style={{ fontSize: 28 }}>{todayMood ? getMoodEmoji(todayMood.mood) : "🌤️"}</div>
                    <div>
                      <strong>{todayMood ? getMoodDisplay(todayMood.mood) : "Not logged yet"}</strong>
                      <span>{todayMood ? "Mood recorded for today" : "Add a mood when you're ready"}</span>
                    </div>
                  </div>
                </div>

                {todayMood ? (
                  <>
                    <p style={{ color: todayMood.mood === "not_added" ? "#b45309" : "#475569", marginTop: 0 }}>
                      {todayMood.mood === "not_added" ? "Auto-filled as Not Added" : "You have already logged today."}
                    </p>
                    <p style={{ fontSize: 13, color: "#64748b" }}>
                      Visibility: {todayMood.visibility === "private" ? "🔒 Private" : todayMood.visibility === "circles" ? `👥 Specific Circles (${todayMood.circles?.length || 0})` : "🌍 Public"}
                    </p>
                  </>
                ) : (
                  <p style={{ color: "#7c3aed", marginTop: 0 }}>
                    You haven't logged today's mood yet. Fill it now or it will auto-fill later.
                  </p>
                )}

                <div className="dashboard-mood-buttons">
                  {moodOptions.map((option) => (
                    <button
                      key={option.key}
                      className="dashboard-pill-button"
                      onClick={() => handleMoodClick(option.key)}
                      disabled={!!todayMood}
                      style={{
                        opacity: todayMood ? 0.5 : 1,
                        cursor: todayMood ? "not-allowed" : "pointer",
                        boxShadow: `0 0 0 1px ${option.tone}22 inset`,
                      }}
                    >
                      {option.emoji} {option.label}
                    </button>
                  ))}
                </div>

                {error && (
                  <div style={{
                    marginTop: 16,
                    padding: "12px 14px",
                    background: "rgba(244, 63, 94, 0.08)",
                    border: "1px solid rgba(244, 63, 94, 0.16)",
                    borderRadius: 16,
                    color: "#be123c",
                  }}>
                    {error}
                  </div>
                )}
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card-header">
                  <div className="dashboard-card-title">
                    <span className="label">Quick Actions</span>
                    <h3>Move through your day</h3>
                  </div>
                </div>

                <div className="dashboard-quick-grid">
                  {quickActions.map((action) => (
                    <button
                      key={action.to}
                      className="dashboard-quick-card"
                      onClick={() => navigate(action.to)}
                      style={{ background: action.accent }}
                    >
                      <div className="icon">{action.icon}</div>
                      <strong>{action.label}</strong>
                      <span style={{ color: "#64748b", fontSize: 14 }}>Open {action.label.toLowerCase()}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card-header">
                  <div className="dashboard-card-title">
                    <span className="label">Recent Posts</span>
                    <h3>Updates from your circles</h3>
                  </div>
                  <button className="dashboard-secondary-button" onClick={() => navigate("/circles")}>View circles</button>
                </div>

                {loadingFeed ? (
                  <div className="dashboard-empty-state">Loading your feed...</div>
                ) : feedPosts.length === 0 ? (
                  <div className="dashboard-empty-state">
                    <p style={{ fontSize: 18, margin: 0 }}>📭 No posts yet</p>
                    <p style={{ margin: "10px 0 0" }}>Join some circles to see updates here.</p>
                  </div>
                ) : (
                  <div className="dashboard-feed-list">
                    {feedPosts.map((post) => (
                      <article
                        key={post._id}
                        className="dashboard-feed-item"
                        onClick={() => navigate(`/circles/${post.circle._id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="dashboard-avatar-row">
                          <img
                            src={post.author?.profilePicture || defaultAvatar}
                            alt={post.author?.username}
                          />
                          <div>
                            <strong>{post.author?.displayName || post.author?.username}</strong>
                            <div className="meta">in {post.circle?.name} · {getTimeAgo(post.createdAt)}</div>
                          </div>
                        </div>
                        <h4 style={{ margin: 0 }}>{post.title}</h4>
                        <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                          {post.content}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card-header">
                  <div className="dashboard-card-title">
                    <span className="label">Journals</span>
                    <h3>Your latest reflections</h3>
                  </div>
                  <button className="dashboard-secondary-button" onClick={() => navigate("/journals/new")}>New journal</button>
                </div>

                {loadingJournals ? (
                  <div className="dashboard-empty-state">Loading your journals...</div>
                ) : userJournals.length === 0 ? (
                  <div className="dashboard-empty-state">
                    <p style={{ margin: 0 }}>No journals yet.</p>
                    <p style={{ margin: "8px 0 0" }}>Start one to capture thoughts, habits, and progress.</p>
                  </div>
                ) : (
                  <div className="dashboard-list">
                    {userJournals.slice(0, 4).map((journal) => (
                      <div key={journal._id} className="dashboard-list-item">
                        <div className="meta">
                          {new Date(journal.date).toLocaleDateString()} · {journal.visibility === "private" ? "🔒 Private" : journal.visibility === "circles" ? "👥 Shared" : "🌍 Public"}
                        </div>
                        <strong>{journal.title}</strong>
                        <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                          {journal.body?.slice(0, 150)}{journal.body?.length > 150 ? "…" : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <aside className="dashboard-stack">
              <div className="dashboard-card">
                <div className="dashboard-card-header">
                  <div className="dashboard-card-title">
                    <span className="label">Recommended Circles</span>
                    <h3>Find calming spaces</h3>
                  </div>
                </div>

                {recommendedCircles.length > 0 ? (
                  <div className="dashboard-list">
                    {recommendedCircles.map((circle) => (
                      <div
                        key={circle._id}
                        className="dashboard-compact-item"
                        onClick={() => navigate(`/circles/${circle._id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="dashboard-avatar-row">
                          <div className="dashboard-circle-thumb">◌</div>
                          <div>
                            <strong>{circle.name}</strong>
                            <div className="meta">{circle.tags?.slice(0, 3).join(" · ") || "Wellness circle"}</div>
                          </div>
                        </div>
                        <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                          {circle.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dashboard-empty-state">No recommendations yet.</div>
                )}

                <button className="dashboard-secondary-button" style={{ width: "100%", marginTop: 14 }} onClick={() => navigate("/circles")}>
                  View all circles
                </button>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card-header">
                  <div className="dashboard-card-title">
                    <span className="label">Mood Analytics</span>
                    <h3>Your recent pattern</h3>
                  </div>
                </div>

                <div className="dashboard-analytics">
                  {moodSummary.map((item) => {
                    const width = Math.round((item.count / totalMoodEntries) * 100);
                    return (
                      <div key={item.key} className="dashboard-bar">
                        <div className="dashboard-bar-row">
                          <strong style={{ minWidth: 88 }}>{item.label}</strong>
                          <span className="dashboard-bar-track">
                            <span className="dashboard-bar-fill" style={{ width: `${width}%`, background: `linear-gradient(90deg, ${item.color}, ${item.color}cc)` }} />
                          </span>
                          <span style={{ minWidth: 28, textAlign: "right", color: "#64748b" }}>{item.count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="dashboard-stat-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))", marginTop: 16 }}>
                  <div className="dashboard-stat">
                    <strong>{moods.slice(0, 7).length}</strong>
                    <span>Recent entries</span>
                  </div>
                  <div className="dashboard-stat">
                    <strong>{hasUpdatedToday ? "Yes" : "No"}</strong>
                    <span>Logged today</span>
                  </div>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card-header">
                  <div className="dashboard-card-title">
                    <span className="label">Mood history</span>
                    <h3>Last seven check-ins</h3>
                  </div>
                </div>

                {moods.length > 0 ? (
                  <div className="dashboard-mood-history">
                    {moods.slice(0, 7).map((mood) => (
                      <div key={mood._id} className="dashboard-list-item">
                        <div className="dashboard-avatar-row">
                          <div className="dashboard-circle-thumb">{getMoodEmoji(mood.mood)}</div>
                          <div>
                            <strong>{getMoodDisplay(mood.mood)}</strong>
                            <div className="meta">{new Date(mood.date).toDateString()}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dashboard-empty-state">No mood history yet.</div>
                )}
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
