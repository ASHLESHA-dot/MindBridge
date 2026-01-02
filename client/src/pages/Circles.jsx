import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const Circles = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 🔑 normalize user id ONCE
  const userId = user?._id || user?.id || null;

  const [circles, setCircles] = useState([]);
  const [filteredCircles, setFilteredCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [allTags, setAllTags] = useState([]);

  /* ================= FETCH ================= */
  useEffect(() => {
    fetchCircles();
  }, []);

  useEffect(() => {
    filterCircles();
  }, [searchQuery, selectedTags, circles]);

  const fetchCircles = async () => {
    try {
      const res = await api.get("/circles");
      setCircles(res.data);
      setFilteredCircles(res.data);

      const tags = new Set();
      res.data.forEach(c => c.tags?.forEach(t => tags.add(t)));
      setAllTags(Array.from(tags));
    } catch (err) {
      console.error("Error fetching circles:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILTER ================= */
  const filterCircles = () => {
    let filtered = circles;

    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter(c =>
        c.tags?.some(tag => selectedTags.includes(tag))
      );
    }

    setFilteredCircles(filtered);
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  /* ================= MEMBERSHIP ================= */
  const isUserMember = (circle) => {
    if (!userId || !Array.isArray(circle?.members)) return false;

    return circle.members.some(member => {
      if (!member) return false;

      if (typeof member === "object" && member._id) {
        return String(member._id) === String(userId);
      }

      if (typeof member === "string") {
        return member === String(userId);
      }

      return false;
    });
  };

  /* ================= JOIN ================= */
  const joinCircle = async (circleId, e) => {
    e.stopPropagation();

    if (!userId) {
      alert("Please log in to join circles");
      return;
    }

    try {
      const res = await api.post(`/circles/${circleId}/join`);

      // Optimistic update (covers "Already a member" too)
      setCircles(prev =>
        prev.map(c =>
          c._id === circleId
            ? {
                ...c,
                members: Array.from(
                  new Set([...(c.members || []), String(userId)])
                )
              }
            : c
        )
      );

      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.message || "Error joining circle");
    }
  };

  /* ================= RENDER ================= */
  if (loading) {
    return <div style={{ textAlign: "center", padding: 50 }}>Loading circles...</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 30 }}>
        <h1>Discover Circles</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => navigate("/circles/new")}
            style={btnPrimary}
          >
            ➕ Create Circle
          </button>
          <button
            onClick={() => navigate("/")}
            style={btnSecondary}
          >
            ← Dashboard
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <input
        placeholder="🔍 Search circles..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        style={searchStyle}
      />

      {/* TAGS */}
      {allTags.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                style={{
                  ...tagBtn,
                  backgroundColor: selectedTags.includes(tag) ? "#007bff" : "#eee",
                  color: selectedTags.includes(tag) ? "white" : "#333"
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* GRID */}
      <div style={gridStyle}>
        {filteredCircles.map(circle => {
          const isMember = isUserMember(circle);

          return (
            <div
              key={circle._id}
              style={cardStyle}
              onClick={() => navigate(`/circles/${circle._id}`)}
            >
              {/* COVER */}
              <div
                style={{
                  height: 180,
                  backgroundImage: circle.coverImage ? `url(${circle.coverImage})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundColor: "#eee"
                }}
              />

              <div style={{ padding: 16 }}>
                <h3>{circle.name}</h3>
                <p style={{ color: "#666", minHeight: 40 }}>
                  {circle.description}
                </p>

                <div style={{ marginBottom: 10 }}>
                  👥 {circle.members?.length || 0} members
                </div>

                {isMember ? (
                  <button
                    style={btnJoined}
                    onClick={e => {
                      e.stopPropagation();
                      navigate(`/circles/${circle._id}`);
                    }}
                  >
                    ✓ Joined
                  </button>
                ) : (
                  <button
                    style={btnPrimary}
                    onClick={e => joinCircle(circle._id, e)}
                  >
                    {circle.visibility === "private"
                      ? "📝 Request to Join"
                      : "➕ Join Circle"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ================= STYLES ================= */
const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
  gap: 24
};

const cardStyle = {
  background: "white",
  borderRadius: 12,
  overflow: "hidden",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  cursor: "pointer"
};

const btnPrimary = {
  width: "100%",
  padding: 11,
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  borderRadius: 8,
  fontWeight: 600,
  cursor: "pointer"
};

const btnJoined = {
  ...btnPrimary,
  backgroundColor: "#28a745"
};

const btnSecondary = {
  ...btnPrimary,
  backgroundColor: "#6c757d"
};

const searchStyle = {
  width: "100%",
  padding: 14,
  marginBottom: 20,
  fontSize: 16,
  borderRadius: 8,
  border: "2px solid #e0e0e0"
};

const tagBtn = {
  padding: "6px 14px",
  borderRadius: 20,
  border: "none",
  cursor: "pointer",
  fontSize: 14
};

export default Circles;
