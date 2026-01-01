import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

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
      case "private":
        return "🔒";
      case "circles":
        return "👥";
      case "public":
        return "🌍";
      default:
        return "📝";
    }
  };

  const getVisibilityText = (journal) => {
    switch (journal.visibility) {
      case "private":
        return "Private";
      case "circles":
        return `Shared with ${journal.sharedCircles?.length || 0} circle(s)`;
      case "public":
        return "Public";
      default:
        return "Unknown";
    }
  };

  if (loading) return <p>Loading journals...</p>;

  return (
    <div style={{ maxWidth: 800, margin: "auto", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>My Journals</h2>
        <div>
          <button 
            onClick={() => navigate("/")}
            style={{ marginRight: "10px", padding: "10px 15px" }}
          >
            ← Dashboard
          </button>
          <button
            onClick={() => navigate("/journals/new")}
            style={{ padding: "10px 20px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
          >
            ✍️ New Journal Entry
          </button>
        </div>
      </div>

      {journals.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
          <p style={{ fontSize: "18px", color: "#666" }}>No journal entries yet</p>
          <button
            onClick={() => navigate("/journals/new")}
            style={{ 
              marginTop: "15px",
              padding: "10px 20px", 
              backgroundColor: "#4CAF50", 
              color: "white", 
              border: "none", 
              borderRadius: "5px", 
              cursor: "pointer" 
            }}
          >
            Create Your First Entry
          </button>
        </div>
      ) : (
        <div>
          {journals.map((journal) => (
            <div
              key={journal._id}
              style={{
                border: "1px solid #ddd",
                padding: "20px",
                marginBottom: "15px",
                borderRadius: "8px",
                backgroundColor: "white",
                cursor: "pointer",
                transition: "box-shadow 0.2s"
              }}
              onClick={() => navigate(`/journals/${journal._id}`)}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)"}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "10px" }}>
                <h3 style={{ margin: 0 }}>{journal.title}</h3>
                <span style={{ 
                  fontSize: "12px", 
                  padding: "4px 8px", 
                  backgroundColor: "#f0f0f0",
                  borderRadius: "4px",
                  whiteSpace: "nowrap",
                  marginLeft: "10px"
                }}>
                  {getVisibilityIcon(journal)} {getVisibilityText(journal)}
                </span>
              </div>

              <p style={{ margin: "10px 0", color: "#666" }}>
                {journal.body.substring(0, 150)}
                {journal.body.length > 150 && "..."}
              </p>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <small style={{ color: "#999" }}>
                  {new Date(journal.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </small>

                {journal.sharedCircles && journal.sharedCircles.length > 0 && (
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    Shared with: {journal.sharedCircles.map(c => c.name).join(", ")}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}