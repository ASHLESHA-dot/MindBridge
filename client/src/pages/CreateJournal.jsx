import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/wellness-ui.css";

export default function CreateJournal() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [selectedCircles, setSelectedCircles] = useState([]);
  const [userCircles, setUserCircles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserCircles();
  }, []);

  const fetchUserCircles = async () => {
    try {
      const res = await api.get("/circles/joined");
      setUserCircles(res.data);
    } catch (err) {
      console.error("Error fetching circles:", err);
    }
  };

  const handleCircleToggle = (circleId) => {
    setSelectedCircles((prev) =>
      prev.includes(circleId)
        ? prev.filter((id) => id !== circleId)
        : [...prev, circleId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (visibility === "circles" && selectedCircles.length === 0) {
      alert("Please select at least one circle to share with");
      return;
    }

    setLoading(true);
    try {
      await api.post("/journals", {
        title,
        body,
        visibility,
        sharedCircles: visibility === "circles" ? selectedCircles : [],
      });

      alert("Journal created successfully!");
      navigate("/journals");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create journal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wellness-page">
      <span className="wellness-blob one" />
      <span className="wellness-blob two" />

      <div className="wellness-shell wellness-form-shell">
        <header className="wellness-header">
          <div className="wellness-hero">
            <span className="eyebrow">Reflection editor</span>
            <h1>Write a journal entry that feels safe and intentional</h1>
            <p>Capture your thoughts, choose who can see them, and build a healthy reflection habit with a calm interface.</p>
          </div>

          <div className="wellness-actions">
            <button className="wellness-button-secondary" onClick={() => navigate("/journals")}>← Back to Journals</button>
          </div>
        </header>

        <div className="wellness-card wellness-form-card">
          <form onSubmit={handleSubmit} className="wellness-form-stack">
            <label className="wellness-form-label">Title</label>
            <input
              className="wellness-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your journal a title..."
              required
            />

            <label className="wellness-form-label">Content</label>
            <textarea
              className="wellness-textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your thoughts..."
              required
            />

            <div className="wellness-card" style={{ padding: 18, background: "rgba(255,255,255,0.7)" }}>
              <label className="wellness-form-label">Who can see this?</label>

              <div className="wellness-form-stack" style={{ marginTop: 14 }}>
                <label className="wellness-tile" style={{ cursor: "pointer" }}>
                  <div className="wellness-avatar-row">
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={visibility === "private"}
                      onChange={(e) => {
                        setVisibility(e.target.value);
                        setSelectedCircles([]);
                      }}
                    />
                    <div>
                      <strong>🔒 Private</strong>
                      <div className="wellness-meta">Only you can see this journal entry</div>
                    </div>
                  </div>
                </label>

                <label className="wellness-tile" style={{ cursor: "pointer" }}>
                  <div className="wellness-avatar-row" style={{ alignItems: "flex-start" }}>
                    <input
                      type="radio"
                      name="visibility"
                      value="circles"
                      checked={visibility === "circles"}
                      onChange={(e) => setVisibility(e.target.value)}
                    />
                    <div style={{ flex: 1 }}>
                      <strong>👥 Share with Circles</strong>
                      <div className="wellness-meta">Share with members of selected circles</div>

                      {visibility === "circles" && (
                        <div style={{ marginTop: 14 }}>
                          {userCircles.length === 0 ? (
                            <p className="wellness-muted" style={{ fontStyle: "italic" }}>
                              You haven't joined any circles yet. Join circles to share with them!
                            </p>
                          ) : (
                            <div className="wellness-form-stack">
                              {userCircles.map((circle) => (
                                <label
                                  key={circle._id}
                                  className="wellness-list-item"
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    margin: 0,
                                    cursor: "pointer",
                                    background: selectedCircles.includes(circle._id) ? "rgba(167,139,250,.14)" : "rgba(255,255,255,.78)",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedCircles.includes(circle._id)}
                                    onChange={() => handleCircleToggle(circle._id)}
                                  />
                                  <span>{circle.name}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </label>

                <label className="wellness-tile" style={{ cursor: "pointer" }}>
                  <div className="wellness-avatar-row">
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={visibility === "public"}
                      onChange={(e) => {
                        setVisibility(e.target.value);
                        setSelectedCircles([]);
                      }}
                    />
                    <div>
                      <strong>🌍 Public</strong>
                      <div className="wellness-meta">Anyone on MindBridge can see this journal entry</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="wellness-actions" style={{ justifyContent: "flex-start" }}>
              <button type="button" onClick={() => navigate("/journals")} className="wellness-button-ghost">Cancel</button>
              <button type="submit" className="wellness-button" disabled={loading}>
                {loading ? "Creating..." : "Create Journal Entry"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
