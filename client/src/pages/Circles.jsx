import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../styles/wellness-ui.css";

const Circles = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?._id || user?.id || null;

  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [joiningId, setJoiningId] = useState(null);

  useEffect(() => {
    fetchCircles();
  }, []);

  const fetchCircles = async () => {
    try {
      const res = await api.get("/circles");
      setCircles(res.data);

      const tags = new Set();
      res.data.forEach((circle) => circle.tags?.forEach((tag) => tags.add(tag)));
      setAllTags(Array.from(tags));
    } catch (err) {
      console.error("Error fetching circles:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCircles = useMemo(() => {
    let next = circles;

    if (searchQuery) {
      next = next.filter((circle) =>
        circle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        circle.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedTags.length > 0) {
      next = next.filter((circle) => circle.tags?.some((tag) => selectedTags.includes(tag)));
    }

    return next;
  }, [circles, searchQuery, selectedTags]);

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const isUserMember = (circle) => {
    if (!userId || !Array.isArray(circle?.members)) return false;

    return circle.members.some((member) => {
      if (!member) return false;
      if (typeof member === "object" && member._id) return String(member._id) === String(userId);
      if (typeof member === "string") return member === String(userId);
      return false;
    });
  };

  const joinCircle = async (circleId, e) => {
    e.stopPropagation();

    if (!userId) {
      alert("Please log in to join circles");
      return;
    }

    try {
      setJoiningId(circleId);
      const res = await api.post(`/circles/${circleId}/join`);
      setCircles((prev) =>
        prev.map((circle) =>
          circle._id === circleId
            ? {
                ...circle,
                members: Array.from(new Set([...(circle.members || []), String(userId)])),
              }
            : circle
        )
      );
      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.message || "Error joining circle");
    } finally {
      setJoiningId(null);
    }
  };

  if (loading) {
    return (
      <div className="wellness-page">
        <div className="wellness-shell">
          <div className="wellness-empty-state">Loading circles...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="wellness-page">
      <span className="wellness-blob one" />
      <span className="wellness-blob two" />

      <div className="wellness-shell">
        <header className="wellness-header">
          <div className="wellness-hero">
            <span className="eyebrow">Community spaces</span>
            <h1>Discover circles that feel supportive and calm</h1>
            <p>Browse wellness-focused groups, filter by your interests, and join conversations that match your pace.</p>
          </div>

          <div className="wellness-actions">
            <button className="wellness-button" onClick={() => navigate("/circles/new")}>➕ Create Circle</button>
            <button className="wellness-button-secondary" onClick={() => navigate("/")}>← Dashboard</button>
          </div>
        </header>

        <section className="wellness-card wellness-form-card" style={{ marginBottom: 20 }}>
          <input
            className="wellness-search"
            placeholder="🔍 Search circles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {allTags.length > 0 && (
            <div className="wellness-pill-row">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`wellness-pill ${selectedTags.includes(tag) ? "active" : ""}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </section>

        <div className="wellness-grid-cards">
          {filteredCircles.map((circle) => {
            const isMember = isUserMember(circle);
            return (
              <article key={circle._id} className="wellness-card wellness-tile" onClick={() => navigate(`/circles/${circle._id}`)} style={{ cursor: "pointer" }}>
                <div style={{ height: 190, borderRadius: 16, overflow: "hidden", marginBottom: 16, background: circle.coverImage ? `url(${circle.coverImage}) center/cover` : "linear-gradient(135deg, rgba(124,111,246,.12), rgba(244,114,182,.12))" }} />
                <div style={{ display: "grid", gap: 12 }}>
                  <div>
                    <div className="wellness-badge">👥 {circle.members?.length || 0} members</div>
                    <h3 style={{ marginTop: 12 }}>{circle.name}</h3>
                    <p className="wellness-muted" style={{ lineHeight: 1.7 }}>{circle.description}</p>
                  </div>

                  <div className="wellness-tag-row">
                    {circle.tags?.slice(0, 3).map((tag) => (
                      <span key={tag} className="wellness-badge">#{tag}</span>
                    ))}
                  </div>

                  {isMember ? (
                    <button
                      className="wellness-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/circles/${circle._id}`);
                      }}
                    >
                      ✓ Joined
                    </button>
                  ) : (
                    <button
                      className="wellness-button"
                      onClick={(e) => joinCircle(circle._id, e)}
                      disabled={joiningId === circle._id}
                    >
                      {joiningId === circle._id
                        ? "Joining..."
                        : circle.visibility === "private"
                          ? "📝 Request to Join"
                          : "➕ Join Circle"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {filteredCircles.length === 0 && (
          <div className="wellness-empty-state" style={{ marginTop: 20 }}>
            No circles match your search yet. Try a different tag or create a new community.
          </div>
        )}
      </div>
    </div>
  );
};

export default Circles;
