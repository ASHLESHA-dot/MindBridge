import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Circles = () => {
  const [circles, setCircles] = useState([]);
  const [filteredCircles, setFilteredCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const navigate = useNavigate();

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
      
      // Extract all unique tags
      const tags = new Set();
      res.data.forEach(circle => {
        circle.tags?.forEach(tag => tags.add(tag));
      });
      setAllTags(Array.from(tags));
    } catch (err) {
      console.error("Error fetching circles:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterCircles = () => {
    let filtered = circles;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(circle =>
        circle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        circle.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(circle =>
        circle.tags?.some(tag => selectedTags.includes(tag))
      );
    }

    setFilteredCircles(filtered);
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const joinCircle = async (id) => {
    try {
      await api.post(`/circles/${id}/join`);
      alert("Joined circle successfully!");
      fetchCircles();
    } catch (err) {
      alert(err.response?.data?.message || "Error joining circle");
    }
  };

  if (loading) return <p>Loading circles...</p>;

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>Discover Circles</h2>
        <button onClick={() => navigate("/")}>← Back to Dashboard</button>
      </div>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search circles..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ width: "100%", padding: "10px", marginBottom: "15px", fontSize: "16px" }}
      />

      {/* Tag Filters */}
      {allTags.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <p style={{ fontWeight: "bold", marginBottom: "10px" }}>Filter by tags:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                style={{
                  padding: "6px 12px",
                  backgroundColor: selectedTags.includes(tag) ? "#4CAF50" : "#e0e0e0",
                  color: selectedTags.includes(tag) ? "white" : "black",
                  border: "none",
                  borderRadius: "15px",
                  cursor: "pointer"
                }}
              >
                {tag}
              </button>
            ))}
          </div>
          {selectedTags.length > 0 && (
            <button 
              onClick={() => setSelectedTags([])}
              style={{ marginTop: "10px", padding: "5px 10px" }}
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Circles List */}
      <p>{filteredCircles.length} circle(s) found</p>
      
      {filteredCircles.length === 0 && <p>No circles match your search.</p>}

      {filteredCircles.map((circle) => (
        <div 
          key={circle._id} 
          style={{ 
            border: "1px solid #ccc", 
            padding: "15px", 
            marginBottom: "15px",
            borderRadius: "8px"
          }}
        >
          <h3>{circle.name}</h3>
          <p>{circle.description}</p>
          
          {circle.tags && circle.tags.length > 0 && (
            <div style={{ marginBottom: "10px" }}>
              {circle.tags.map((tag, i) => (
                <span 
                  key={i}
                  style={{ 
                    fontSize: "12px", 
                    backgroundColor: "#e0e0e0", 
                    padding: "4px 8px",
                    borderRadius: "5px",
                    marginRight: "5px"
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          <button 
            onClick={() => joinCircle(circle._id)}
            style={{ marginRight: "10px", padding: "8px 15px" }}
          >
            Join
          </button>
          <button 
            onClick={() => navigate(`/circles/${circle._id}`)}
            style={{ padding: "8px 15px" }}
          >
            View Circle →
          </button>
        </div>
      ))}
      <button onClick={() => navigate("/circles/new")}>
  ➕ Create Circle
</button>
    </div>
    
  );
};


export default Circles;