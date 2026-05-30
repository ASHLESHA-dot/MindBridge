import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/wellness-ui.css";

export default function Journals() {
  const navigate = useNavigate();
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    try {
      const res = await api.get("/journals");
      setJournals(res.data);
    } catch (err) {
      console.error("Error fetching journals:", err);
    } finally {
      setLoading(false);
    }
  };

  const getVisibilityIcon = (journal) => {
    switch (journal.visibility) {
      case "private": return "🔒";
      case "circles": return "👥";
      case "public": return "🌍";
      default: return "📝";
    }
  };

  const getVisibilityText = (journal) => {
    switch (journal.visibility) {
      case "private": return "Private";
      case "circles": return `Shared with ${journal.sharedCircles?.length || 0} circle(s)`;
      case "public": return "Public";
      default: return "Unknown";
    }
  };

  if (loading) {
    return (
      <div className="wellness-page">
        <div className="wellness-shell">
          <div className="wellness-empty-state">Loading journals...</div>
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
            <span className="eyebrow">Reflection space</span>
            <h1>Your journals in one calming view</h1>
            <p>Review reflections, spot patterns, and keep your mental wellness journey organized in a soft, distraction-free layout.</p>
          </div>

          <div className="wellness-actions">
            <button className="wellness-button-secondary" onClick={() => navigate("/")}>← Dashboard</button>
            <button className="wellness-button" onClick={() => navigate("/journals/new")}>✍️ New Journal Entry</button>
          </div>
        </header>

        {journals.length === 0 ? (
          <div className="wellness-card wellness-empty-state">
            <p style={{ fontSize: 18, margin: 0 }}>No journal entries yet</p>
            <p style={{ margin: "10px 0 0" }}>Start a reflection to capture thoughts, gratitude, and growth.</p>
            <button className="wellness-button" style={{ marginTop: 16 }} onClick={() => navigate("/journals/new")}>
              Create Your First Entry
            </button>
          </div>
        ) : (
          <div className="wellness-stack">
            {journals.map((journal) => (
              <article
                key={journal._id}
                className="wellness-card wellness-list-item"
                onClick={() => navigate(`/journals/${journal._id}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="wellness-card-header">
                  <div className="wellness-card-title">
                    <span className="wellness-label">{new Date(journal.date).toLocaleDateString()}</span>
                    <h3>{journal.title}</h3>
                  </div>
                  <span className="wellness-badge">{getVisibilityIcon(journal)} {getVisibilityText(journal)}</span>
                </div>

                <p className="wellness-muted" style={{ lineHeight: 1.75, marginTop: 0 }}>
                  {journal.body.substring(0, 180)}{journal.body.length > 180 && "..."}
                </p>

                {journal.sharedCircles && journal.sharedCircles.length > 0 && (
                  <div className="wellness-muted" style={{ fontSize: 13 }}>
                    Shared with: {journal.sharedCircles.map((circle) => circle.name).join(", ")}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
