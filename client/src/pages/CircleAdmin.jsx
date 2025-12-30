import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function CircleAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [circle, setCircle] = useState(null);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCircle();
    fetchJoinRequests();
  }, [id]);

  const fetchCircle = async () => {
    try {
      const res = await api.get(`/circles/${id}`);
      setCircle(res.data);
    } catch (err) {
      console.error("Error fetching circle:", err);
      if (err.response?.status === 403) {
        alert("You don't have admin access to this circle");
        navigate(`/circles/${id}`);
      }
    }
  };

  const fetchJoinRequests = async () => {
    try {
      const res = await api.get(`/circles/${id}/requests`);
      setJoinRequests(res.data);
    } catch (err) {
      console.error("Error fetching join requests:", err);
      if (err.response?.status === 403) {
        alert("You don't have admin access to this circle");
        navigate(`/circles/${id}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (userId, action) => {
    try {
      await api.post(`/circles/${id}/requests/${userId}`, { action });
      alert(`Request ${action}d successfully`);
      fetchJoinRequests();
      fetchCircle();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} request`);
    }
  };

  const removeMember = async (userId) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      await api.delete(`/circles/${id}/members/${userId}`);
      alert("Member removed successfully");
      fetchCircle();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove member");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!circle) return <p>Circle not found</p>;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <button onClick={() => navigate(`/circles/${id}`)}>← Back to Circle</button>

      <h1>Admin Dashboard - {circle.name}</h1>

      {/* Join Requests */}
      <div style={{ marginTop: "30px" }}>
        <h2>Join Requests ({joinRequests.length})</h2>
        {joinRequests.length === 0 ? (
          <p>No pending join requests</p>
        ) : (
          <div>
            {joinRequests.map(user => (
              <div
                key={user._id}
                style={{
                  border: "1px solid #ccc",
                  padding: "15px",
                  marginBottom: "10px",
                  borderRadius: "5px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <strong>{user.username}</strong>
                  {user.displayName && <span> ({user.displayName})</span>}
                  <br />
                  <small style={{ color: "#666" }}>{user.email}</small>
                </div>
                <div>
                  <button
                    onClick={() => handleRequest(user._id, "approve")}
                    style={{
                      backgroundColor: "#4CAF50",
                      color: "white",
                      marginRight: "10px",
                      padding: "8px 15px"
                    }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleRequest(user._id, "reject")}
                    style={{
                      backgroundColor: "#f44336",
                      color: "white",
                      padding: "8px 15px"
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Members List */}
      <div style={{ marginTop: "30px" }}>
        <h2>Members ({circle.members?.length || 0})</h2>
        {circle.members?.map(member => (
          <div
            key={member._id}
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              marginBottom: "10px",
              borderRadius: "5px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <strong>{member.username}</strong>
              {circle.creator.toString() === member._id && (
                <span style={{ color: "gold", marginLeft: "10px" }}>👑 Creator</span>
              )}
              {circle.admins?.some(a => a._id === member._id) && (
                <span style={{ color: "blue", marginLeft: "10px" }}>⭐ Admin</span>
              )}
            </div>
            {circle.creator.toString() !== member._id && (
              <button
                onClick={() => removeMember(member._id)}
                style={{
                  backgroundColor: "#f44336",
                  color: "white",
                  padding: "6px 12px"
                }}
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}