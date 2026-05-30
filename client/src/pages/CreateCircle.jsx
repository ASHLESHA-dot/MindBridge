import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/wellness-ui.css";

export default function CreateCircle() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/circles", {
        name,
        description,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        visibility,
      });
      navigate(`/circles/${res.data._id}`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create circle");
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
            <span className="eyebrow">Circle builder</span>
            <h1>Create a calm, welcoming circle</h1>
            <p>Set up a supportive space for mindfulness, study, journaling, or any other wellness-centered purpose.</p>
          </div>

          <div className="wellness-actions">
            <button className="wellness-button-secondary" onClick={() => navigate("/circles")}>← Back to Circles</button>
          </div>
        </header>

        <div className="wellness-card wellness-form-card">
          <form onSubmit={handleSubmit} className="wellness-form-stack">
            <div className="wellness-form-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
              <div>
                <label className="wellness-form-label">Circle Name</label>
                <input
                  className="wellness-input"
                  placeholder="e.g. Mindfulness Group"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="wellness-form-label">Visibility</label>
                <select className="wellness-select" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                  <option value="public">Public - anyone can join</option>
                  <option value="private">Private - approval required</option>
                </select>
              </div>
            </div>

            <div>
              <label className="wellness-form-label">Description</label>
              <textarea
                className="wellness-textarea"
                placeholder="What is this circle about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="wellness-form-label">Tags</label>
              <input
                className="wellness-input"
                placeholder="mental health, journaling, growth"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <small className="wellness-muted">Separate tags with commas</small>
            </div>

            <div className="wellness-actions" style={{ justifyContent: "flex-start" }}>
              <button type="button" onClick={() => navigate("/circles")} className="wellness-button-ghost" disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="wellness-button" disabled={loading}>
                {loading ? "Creating..." : "Create Circle"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
