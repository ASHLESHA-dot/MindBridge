import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function CircleAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [circle, setCircle] = useState(null);
  const [joinRequests, setJoinRequests] = useState([]);
  const [reports, setReports] = useState([]);
  const [moderationActions, setModerationActions] = useState([]);
  const [reportStatusFilter, setReportStatusFilter] = useState("all");
  const [reportReasonFilter, setReportReasonFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCircle();
    fetchJoinRequests();
    fetchReports();
    fetchModerationActions();
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

  const fetchReports = async () => {
    try {
      const res = await api.get(`/circles/${id}/reports`);
      setReports(res.data);
    } catch (err) {
      console.error("Error fetching reports:", err);
    }
  };

  const fetchModerationActions = async () => {
    try {
      const res = await api.get(`/circles/${id}/actions`);
      setModerationActions(res.data);
    } catch (err) {
      console.error("Error fetching moderation actions:", err);
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

  const submitModerationAction = async (report, action, options = {}) => {
    const actionLabels = {
      approve: "Dismiss this report and keep the content",
      remove: "Remove the reported content",
      archive: "Archive the reported content",
      flag: "Flag for additional review",
      warn: "Send a warning",
      mute: "Mute the content author for 24h",
      suspend: "Suspend the content author for 72h",
      "remove-user": "Remove the user from this circle",
      edit: "Edit the reported content",
    };

    if (!confirm(actionLabels[action] || `Apply ${action} action?`)) return;

    try {
      await api.post(`/circles/${id}/reports/${report._id}/action`, {
        action,
        reason: options.reason || report.reason,
        duration: options.duration,
        severity: options.severity || "medium",
        editedTitle: options.editedTitle,
        editedContent: options.editedContent,
        editedDescription: options.editedDescription,
      });

      await Promise.all([fetchReports(), fetchModerationActions(), fetchCircle()]);
      alert("Moderation action saved");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to apply moderation action");
    }
  };

  const promptEditReport = async (report) => {
    const nextTitle = report.contentSnapshot?.title ? prompt("Edited title", report.contentSnapshot.title) : null;
    const nextContent = prompt("Edited content", report.contentSnapshot?.body || "");

    if (nextContent === null) return;

    await submitModerationAction(report, "edit", {
      editedTitle: nextTitle || undefined,
      editedContent: nextContent,
    });
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

  const filteredReports = reports
    .filter((report) => reportStatusFilter === "all" || report.status === reportStatusFilter)
    .filter((report) => reportReasonFilter === "all" || report.reason === reportReasonFilter);

  const uniqueReportReasons = [...new Set(reports.map((report) => report.reason))].sort();

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

      {/* Moderation Queue */}
      <div style={{ marginTop: "40px" }}>
        <h2>🛡️ Moderation Queue ({filteredReports.length})</h2>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
          <select value={reportStatusFilter} onChange={(event) => setReportStatusFilter(event.target.value)} style={{ padding: "8px 12px" }}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
          <select value={reportReasonFilter} onChange={(event) => setReportReasonFilter(event.target.value)} style={{ padding: "8px 12px" }}>
            <option value="all">All reasons</option>
            {uniqueReportReasons.map((reason) => (
              <option key={reason} value={reason}>{reason}</option>
            ))}
          </select>
        </div>

        {filteredReports.length === 0 ? (
          <p style={{ color: "#999", fontStyle: "italic" }}>No reports match the current filters.</p>
        ) : (
          <div style={{ display: "grid", gap: "14px" }}>
            {filteredReports.map((report) => (
              <div
                key={report._id}
                style={{
                  border: "1px solid #ddd",
                  padding: "16px",
                  borderRadius: "10px",
                  backgroundColor: report.status === "pending" ? "#fffaf0" : "white",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                  <div>
                    <strong style={{ fontSize: "16px" }}>
                      {report.contentType.toUpperCase()} • {report.contentSnapshot?.title || report.contentType}
                    </strong>
                    <div style={{ color: "#666", marginTop: "4px" }}>
                      Author: {report.contentSnapshot?.authorName || report.contentAuthorId?.displayName || report.contentAuthorId?.username || "Unknown"}
                    </div>
                    <div style={{ color: "#666", marginTop: "4px" }}>
                      Reports for this content: {report.reportCount}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ padding: "4px 10px", borderRadius: "999px", background: "#f3f4f6", fontSize: "12px" }}>
                      {report.status}
                    </span>
                    <div style={{ marginTop: "6px", color: "#666" }}>
                      {new Date(report.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "12px", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                  {report.contentSnapshot?.body || report.description || "No details provided."}
                </div>

                <div style={{ marginTop: "10px", color: "#666" }}>
                  Reason: {report.reason} • Reporter: {report.reporterName || "Anonymous"}
                </div>

                {report.description && (
                  <div style={{ marginTop: "8px", color: "#444", fontStyle: "italic" }}>
                    Report note: {report.description}
                  </div>
                )}

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "14px" }}>
                  <button onClick={() => submitModerationAction(report, "approve")} style={{ backgroundColor: "#4CAF50", color: "white", padding: "8px 14px", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                    Approve
                  </button>
                  <button onClick={() => submitModerationAction(report, "remove")} style={{ backgroundColor: "#f44336", color: "white", padding: "8px 14px", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                    Remove
                  </button>
                  <button onClick={() => submitModerationAction(report, "archive")} style={{ backgroundColor: "#FF9800", color: "white", padding: "8px 14px", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                    Archive
                  </button>
                  <button onClick={() => submitModerationAction(report, "flag")} style={{ backgroundColor: "#6b7280", color: "white", padding: "8px 14px", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                    Flag
                  </button>
                  <button onClick={() => submitModerationAction(report, "warn")} style={{ backgroundColor: "#8b5cf6", color: "white", padding: "8px 14px", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                    Warn
                  </button>
                  <button onClick={() => submitModerationAction(report, "mute", { duration: "24h" })} style={{ backgroundColor: "#0ea5e9", color: "white", padding: "8px 14px", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                    Mute 24h
                  </button>
                  <button onClick={() => submitModerationAction(report, "suspend", { duration: "72h" })} style={{ backgroundColor: "#b91c1c", color: "white", padding: "8px 14px", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                    Suspend 72h
                  </button>
                  <button onClick={() => submitModerationAction(report, "remove-user")} style={{ backgroundColor: "#111827", color: "white", padding: "8px 14px", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                    Remove User
                  </button>
                  {(report.contentType === "post" || report.contentType === "comment") && (
                    <button onClick={() => promptEditReport(report)} style={{ backgroundColor: "#2563eb", color: "white", padding: "8px 14px", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                      Edit Content
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Moderation History */}
      <div style={{ marginTop: "40px" }}>
        <h2>🧾 Moderation History</h2>
        {moderationActions.length === 0 ? (
          <p style={{ color: "#999", fontStyle: "italic" }}>No moderation actions recorded yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {moderationActions.slice(0, 10).map((action) => (
              <div key={action._id} style={{ border: "1px solid #eee", padding: "14px", borderRadius: "8px", backgroundColor: "#fafafa" }}>
                <strong>{action.actionType}</strong>
                <div style={{ color: "#666", marginTop: "4px" }}>
                  {action.targetUserId?.displayName || action.targetUserId?.username || "Unknown user"}
                  {action.duration ? ` • ${action.duration}` : ""}
                </div>
                <div style={{ color: "#666", marginTop: "4px" }}>
                  By {action.adminId?.displayName || action.adminId?.username || "Admin"} on {new Date(action.createdAt).toLocaleString()}
                </div>
                <div style={{ marginTop: "6px" }}>{action.reason}</div>
              </div>
            ))}
          </div>
        )}
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