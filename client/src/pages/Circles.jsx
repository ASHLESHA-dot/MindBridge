import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const Circles = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [circles, setCircles] = useState([]);
  const [filteredCircles, setFilteredCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [allTags, setAllTags] = useState([]);

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

  const joinCircle = async (id, e) => {
    e.stopPropagation(); // Prevent card click
    try {
      const res = await api.post(`/circles/${id}/join`);
      alert(res.data.message);
      fetchCircles();
    } catch (err) {
      alert(err.response?.data?.message || "Error joining circle");
    }
  };

  const isUserMember = (circle) => {
    return circle.members?.some(member => 
      (typeof member === 'object' ? member._id : member) === user?._id
    );
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "50px" }}>Loading circles...</div>;
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ margin: 0 }}>Discover Circles</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={() => navigate("/circles/new")}
            style={{
              padding: "12px 24px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "500"
            }}
          >
            ➕ Create Circle
          </button>
          <button 
            onClick={() => navigate("/")}
            style={{
              padding: "12px 24px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px"
            }}
          >
            ← Dashboard
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="🔍 Search circles by name or description..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ 
          width: "100%", 
          padding: "14px 20px", 
          marginBottom: "20px", 
          fontSize: "16px",
          border: "2px solid #e0e0e0",
          borderRadius: "8px",
          outline: "none"
        }}
        onFocus={(e) => e.target.style.borderColor = "#007bff"}
        onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
      />

      {/* Tag Filters */}
      {allTags.length > 0 && (
        <div style={{ marginBottom: "30px" }}>
          <p style={{ fontWeight: "600", marginBottom: "12px", fontSize: "16px" }}>Filter by tags:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: selectedTags.includes(tag) ? "#007bff" : "#f0f0f0",
                  color: selectedTags.includes(tag) ? "white" : "#333",
                  border: "none",
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "all 0.2s"
                }}
              >
                {tag}
              </button>
            ))}
          </div>
          {selectedTags.length > 0 && (
            <button 
              onClick={() => setSelectedTags([])}
              style={{ 
                marginTop: "12px", 
                padding: "8px 16px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Results Count */}
      <p style={{ marginBottom: "20px", color: "#666", fontSize: "15px" }}>
        {filteredCircles.length} circle(s) found
      </p>

      {/* Circles Grid with Cover Images */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "24px"
      }}>
        {filteredCircles.map(circle => (
          <div
            key={circle._id}
            onClick={() => navigate(`/circles/${circle._id}`)}
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              position: "relative"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
            }}
          >
            {/* Cover Image or Placeholder */}
            <div style={{
              width: "100%",
              height: "180px",
              backgroundColor: circle.coverImage ? "transparent" : "#e9ecef",
              backgroundImage: circle.coverImage ? `url(${circle.coverImage})` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative"
            }}>
              {!circle.coverImage && (
                <span style={{ fontSize: "56px", opacity: 0.3 }}>🔵</span>
              )}
              
              {/* Visibility Badge */}
              <div style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                padding: "6px 12px",
                backgroundColor: circle.visibility === "private" ? "rgba(220, 53, 69, 0.95)" : "rgba(40, 167, 69, 0.95)",
                color: "white",
                borderRadius: "15px",
                fontSize: "12px",
                fontWeight: "600"
              }}>
                {circle.visibility === "private" ? "🔒 Private" : "🌐 Public"}
              </div>
            </div>

            {/* Circle Info */}
            <div style={{ padding: "18px" }}>
              <h3 style={{ 
                margin: "0 0 10px 0",
                fontSize: "19px",
                fontWeight: "600",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}>
                {circle.name}
              </h3>
              
              <p style={{
                margin: "0 0 14px 0",
                color: "#666",
                fontSize: "14px",
                lineHeight: "1.6",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                minHeight: "44px"
              }}>
                {circle.description}
              </p>

              {/* Tags */}
              {circle.tags && circle.tags.length > 0 && (
                <div style={{ 
                  display: "flex", 
                  flexWrap: "wrap", 
                  gap: "6px",
                  marginBottom: "14px"
                }}>
                  {circle.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: "4px 10px",
                        backgroundColor: "#e3f2fd",
                        color: "#1976d2",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "500"
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                  {circle.tags.length > 3 && (
                    <span style={{
                      padding: "4px 10px",
                      backgroundColor: "#f5f5f5",
                      color: "#666",
                      borderRadius: "12px",
                      fontSize: "12px"
                    }}>
                      +{circle.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Member Count */}
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "8px",
                marginBottom: "14px",
                color: "#666",
                fontSize: "14px"
              }}>
                <span>👥</span>
                <span>{circle.members?.length || 0} members</span>
              </div>

              {/* Join Button */}
              {isUserMember(circle) ? (
                <button
                  style={{
                    width: "100%",
                    padding: "11px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "15px"
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/circles/${circle._id}`);
                  }}
                >
                  ✓ Joined - View Circle
                </button>
              ) : (
                <button
                  onClick={(e) => joinCircle(circle._id, e)}
                  style={{
                    width: "100%",
                    padding: "11px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "15px"
                  }}
                >
                  {circle.visibility === "private" ? "📝 Request to Join" : "➕ Join Circle"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredCircles.length === 0 && (
        <div style={{ 
          textAlign: "center", 
          padding: "60px 20px",
          color: "#666",
          backgroundColor: "#f9f9f9",
          borderRadius: "12px"
        }}>
          <h3 style={{ marginBottom: "10px" }}>No circles found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

export default Circles;