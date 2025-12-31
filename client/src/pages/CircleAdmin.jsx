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

  const promoteToAdmin = async (userId) => {
    if (!confirm("Are you sure you want to promote this member to admin?")) return;

    try {
      await api.post(`/circles/${id}/promote/${userId}`);
      alert("Member promoted to admin successfully!");
      fetchCircle();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to promote member");
    }
  };

  const demoteAdmin = async (userId) => {
    if (!confirm("Are you sure you want to demote this admin to regular member?")) return;

    try {
      await api.delete(`/circles/${id}/demote/${userId}`);
      alert("Admin demoted to member successfully!");
      fetchCircle();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to demote admin");
    }
  };

  const isCreator = (userId) => {
    return circle?.creator?._id === userId || circle?.creator?.toString() === userId;
  };

  const isAdmin = (userId) => {
    return circle?.admins?.some(admin => {
      const adminId = typeof admin === 'object' ? admin._id : admin;
      return adminId === userId;
    });
  };

  if (loading) return <p>Loading...</p>;
  if (!circle) return <p>Circle not found</p>;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
      <button onClick={() => navigate(`/circles/${id}`)} style={{ marginBottom: "20px" }}>
        ← Back to Circle
      </button>

      <h1>⚙️ Admin Dashboard - {circle.name}</h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>
        Manage members, join requests, and permissions
      </p>

      {/* Join Requests Section */}
      <div style={{ marginBottom: "40px" }}>
        <h2>📬 Join Requests ({joinRequests.length})</h2>
        {joinRequests.length === 0 ? (
          <p style={{ color: "#999", fontStyle: "italic" }}>No pending join requests</p>
        ) : (
          <div>
            {joinRequests.map(user => (
              <div
                key={user._id}
                style={{
                  border: "1px solid #ddd",
                  padding: "15px",
                  marginBottom: "10px",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "#f9f9f9"
                }}
              >
                <div>
                  <strong style={{ fontSize: "16px" }}>{user.username}</strong>
                  {user.displayName && <span style={{ color: "#666" }}> ({user.displayName})</span>}
                  <br />
                  <small style={{ color: "#999" }}>{user.email}</small>
                </div>
                <div>
                  <button
                    onClick={() => handleRequest(user._id, "approve")}
                    style={{
                      backgroundColor: "#4CAF50",
                      color: "white",
                      marginRight: "10px",
                      padding: "10px 20px",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer"
                    }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleRequest(user._id, "reject")}
                    style={{
                      backgroundColor: "#f44336",
                      color: "white",
                      padding: "10px 20px",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer"
                    }}
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Members List Section */}
      <div>
        <h2>👥 Members ({circle.members?.length || 0})</h2>
        <div>
          {circle.members?.map(member => {
            const memberIsCreator = isCreator(member._id);
            const memberIsAdmin = isAdmin(member._id);

            return (
              <div
                key={member._id}
                style={{
                  border: "1px solid #ddd",
                  padding: "15px",
                  marginBottom: "10px",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: memberIsAdmin ? "#e3f2fd" : "white"
                }}
              >
                <div>
                  <strong style={{ fontSize: "16px" }}>{member.username}</strong>
                  {member.displayName && <span style={{ color: "#666" }}> ({member.displayName})</span>}
                  
                  <div style={{ marginTop: "5px" }}>
                    {memberIsCreator && (
                      <span 
                        style={{ 
                          backgroundColor: "#FFD700", 
                          color: "#333",
                          padding: "3px 8px", 
                          borderRadius: "3px",
                          fontSize: "12px",
                          marginRight: "5px",
                          fontWeight: "bold"
                        }}
                      >
                        👑 Creator
                      </span>
                    )}
                    {memberIsAdmin && (
                      <span 
                        style={{ 
                          backgroundColor: "#2196F3", 
                          color: "white",
                          padding: "3px 8px", 
                          borderRadius: "3px",
                          fontSize: "12px",
                          fontWeight: "bold"
                        }}
                      >
                        ⭐ Admin
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "10px" }}>
                  {!memberIsCreator && (
                    <>
                      {!memberIsAdmin ? (
                        <button
                          onClick={() => promoteToAdmin(member._id)}
                          style={{
                            backgroundColor: "#2196F3",
                            color: "white",
                            padding: "8px 15px",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                            fontSize: "14px"
                          }}
                        >
                          ⬆️ Promote to Admin
                        </button>
                      ) : (
                        <button
                          onClick={() => demoteAdmin(member._id)}
                          style={{
                            backgroundColor: "#FF9800",
                            color: "white",
                            padding: "8px 15px",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                            fontSize: "14px"
                          }}
                        >
                          ⬇️ Demote to Member
                        </button>
                      )}

                      <button
                        onClick={() => removeMember(member._id)}
                        style={{
                          backgroundColor: "#f44336",
                          color: "white",
                          padding: "8px 15px",
                          border: "none",
                          borderRadius: "5px",
                          cursor: "pointer",
                          fontSize: "14px"
                        }}
                      >
                        🗑️ Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Section */}
      <div style={{ 
        marginTop: "40px", 
        padding: "20px", 
        backgroundColor: "#f9f9f9", 
        borderRadius: "8px" 
      }}>
        <h3>📊 Circle Statistics</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px", marginTop: "15px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: "#4CAF50" }}>
              {circle.members?.length || 0}
            </div>
            <div style={{ color: "#666", fontSize: "14px" }}>Total Members</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: "#2196F3" }}>
              {circle.admins?.length || 0}
            </div>
            <div style={{ color: "#666", fontSize: "14px" }}>Admins</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: "#FF9800" }}>
              {joinRequests.length}
            </div>
            <div style={{ color: "#666", fontSize: "14px" }}>Pending Requests</div>
          </div>
        </div>
      </div>
    </div>
  );
}