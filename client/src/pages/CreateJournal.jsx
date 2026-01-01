import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

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
      const res = await api.get("/circles");
      // Filter to only circles the user is a member of
      const myCircles = res.data.filter(circle => 
        circle.members?.some(member => member._id || member)
      );
      setUserCircles(myCircles);
    } catch (err) {
      console.error("Error fetching circles:", err);
    }
  };

  const handleCircleToggle = (circleId) => {
    setSelectedCircles(prev => 
      prev.includes(circleId) 
        ? prev.filter(id => id !== circleId)
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
    <div style={{ maxWidth: 700, margin: "auto", padding: "20px" }}>
      <button onClick={() => navigate("/journals")} style={{ marginBottom: "20px" }}>
        ← Back to Journals
      </button>

      <h2>Create New Journal Entry</h2>

      <form onSubmit={handleSubmit}>
        {/* Title */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Title:
          </label>
          <input
            style={{ width: "100%", padding: "10px", fontSize: "16px" }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your journal a title..."
            required
          />
        </div>

        {/* Body */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Content:
          </label>
          <textarea
            style={{ 
              width: "100%", 
              padding: "10px", 
              minHeight: "200px", 
              fontSize: "16px",
              fontFamily: "inherit"
            }}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your thoughts..."
            required
          />
        </div>

        {/* Visibility Options */}
        <div style={{ 
          marginBottom: "20px", 
          padding: "15px", 
          backgroundColor: "#f9f9f9", 
          borderRadius: "8px",
          border: "1px solid #ddd"
        }}>
          <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold" }}>
            Who can see this?
          </label>

          {/* Private Option */}
          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="radio"
                name="visibility"
                value="private"
                checked={visibility === "private"}
                onChange={(e) => {
                  setVisibility(e.target.value);
                  setSelectedCircles([]);
                }}
                style={{ marginRight: "10px" }}
              />
              <div>
                <strong>🔒 Private</strong>
                <p style={{ margin: "2px 0 0 0", fontSize: "14px", color: "#666" }}>
                  Only you can see this journal entry
                </p>
              </div>
            </label>
          </div>

          {/* Circles Option */}
          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "flex", alignItems: "start", cursor: "pointer" }}>
              <input
                type="radio"
                name="visibility"
                value="circles"
                checked={visibility === "circles"}
                onChange={(e) => setVisibility(e.target.value)}
                style={{ marginRight: "10px", marginTop: "3px" }}
              />
              <div style={{ flex: 1 }}>
                <strong>👥 Share with Circles</strong>
                <p style={{ margin: "2px 0 10px 0", fontSize: "14px", color: "#666" }}>
                  Share with members of selected circles
                </p>

                {visibility === "circles" && (
                  <div style={{ 
                    marginTop: "10px", 
                    paddingLeft: "10px", 
                    borderLeft: "3px solid #2196F3" 
                  }}>
                    {userCircles.length === 0 ? (
                      <p style={{ fontSize: "14px", color: "#999", fontStyle: "italic" }}>
                        You haven't joined any circles yet. Join circles to share with them!
                      </p>
                    ) : (
                      <>
                        <p style={{ fontSize: "14px", marginBottom: "8px", color: "#333" }}>
                          Select circles:
                        </p>
                        {userCircles.map(circle => (
                          <label 
                            key={circle._id} 
                            style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              marginBottom: "8px",
                              cursor: "pointer",
                              padding: "5px",
                              borderRadius: "4px",
                              backgroundColor: selectedCircles.includes(circle._id) ? "#e3f2fd" : "transparent"
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedCircles.includes(circle._id)}
                              onChange={() => handleCircleToggle(circle._id)}
                              style={{ marginRight: "8px" }}
                            />
                            <span style={{ fontSize: "14px" }}>{circle.name}</span>
                          </label>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* Public Option */}
          <div>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={visibility === "public"}
                onChange={(e) => {
                  setVisibility(e.target.value);
                  setSelectedCircles([]);
                }}
                style={{ marginRight: "10px" }}
              />
              <div>
                <strong>🌍 Public</strong>
                <p style={{ margin: "2px 0 0 0", fontSize: "14px", color: "#666" }}>
                  Anyone on MindBridge can see this journal entry
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 30px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "5px",
              fontSize: "16px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? "Creating..." : "Create Journal Entry"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/journals")}
            style={{
              padding: "12px 30px",
              backgroundColor: "#999",
              color: "white",
              border: "none",
              borderRadius: "5px",
              fontSize: "16px",
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}