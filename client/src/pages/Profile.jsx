import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/wellness-ui.css";

export default function Profile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setBio(user.bio || "");
      setInterests(user.interests?.join(", ") || "");
      setProfilePicture(user.profilePicture || "");
    }
  }, [user]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadPicture = async () => {
    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }

    const formData = new FormData();
    formData.append("profilePicture", selectedFile);

    setUploading(true);
    try {
      const res = await api.post("/auth/profile-picture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newProfilePicture = res.data.profilePicture;
      setProfilePicture(newProfilePicture);
      setSelectedFile(null);
      setPreviewUrl("");

      const updatedUser = { ...user, profilePicture: newProfilePicture };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      alert("Profile picture updated successfully!");
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to upload picture");
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePicture = async () => {
    if (!confirm("Are you sure you want to delete your profile picture?")) return;

    try {
      const res = await api.delete("/auth/profile-picture");
      setProfilePicture(res.data.profilePicture);

      const updatedUser = { ...user, profilePicture: res.data.profilePicture };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      alert("Profile picture deleted successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete picture");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put("/auth/profile", {
        displayName,
        bio,
        interests: interests.split(",").map((i) => i.trim()).filter(Boolean),
      });

      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
      alert("Profile updated successfully!");
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update profile");
    }
  };

  return (
    <div className="wellness-page">
      <span className="wellness-blob one" />
      <span className="wellness-blob two" />

      <div className="wellness-shell wellness-form-shell">
        <header className="wellness-header">
          <div className="wellness-hero">
            <span className="eyebrow">Profile studio</span>
            <h1>Edit your calming presence</h1>
            <p>Update your bio, interests, and avatar so your MindBridge profile feels more personal and grounded.</p>
          </div>

          <div className="wellness-actions">
            <button className="wellness-button-secondary" onClick={() => navigate("/")}>← Dashboard</button>
          </div>
        </header>

        <div className="wellness-card wellness-form-card">
          <div className="wellness-form-grid" style={{ gridTemplateColumns: "minmax(260px, 0.8fr) minmax(0, 1.2fr)", alignItems: "start" }}>
            <section className="wellness-card" style={{ background: "rgba(255,255,255,0.72)" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ display: "grid", placeItems: "center", marginBottom: 16 }}>
                  <img
                    src={previewUrl || profilePicture || "https://via.placeholder.com/150"}
                    alt="Profile"
                    style={{ width: 160, height: 160, borderRadius: "50%", objectFit: "cover", border: "4px solid rgba(124,111,246,.18)" }}
                  />
                </div>

                <div className="wellness-form-stack" style={{ marginTop: 14 }}>
                  <input type="file" accept="image/*" onChange={handleFileSelect} className="wellness-input" />
                  <div className="wellness-actions" style={{ justifyContent: "center" }}>
                    {selectedFile && (
                      <button className="wellness-button" onClick={handleUploadPicture} disabled={uploading}>
                        {uploading ? "Uploading..." : "Upload New Picture"}
                      </button>
                    )}
                    {profilePicture && !profilePicture.includes("ui-avatars.com") && (
                      <button className="wellness-button-secondary" onClick={handleDeletePicture}>
                        Delete Picture
                      </button>
                    )}
                  </div>
                  <p className="wellness-muted" style={{ fontSize: 12, margin: 0 }}>
                    Max file size: 5MB. Supported formats: JPG, PNG, GIF
                  </p>
                </div>
              </div>
            </section>

            <section>
              <form onSubmit={handleSubmit} className="wellness-form-stack">
                <label className="wellness-form-label">Display Name</label>
                <input
                  className="wellness-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                />

                <label className="wellness-form-label">Bio</label>
                <textarea
                  className="wellness-textarea"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                />

                <label className="wellness-form-label">Interests (comma-separated)</label>
                <input
                  className="wellness-input"
                  placeholder="anxiety, mindfulness, productivity"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                />

                <div className="wellness-actions" style={{ justifyContent: "flex-start", marginTop: 8 }}>
                  <button type="submit" className="wellness-button">Save Profile</button>
                  <button type="button" onClick={() => navigate("/")} className="wellness-button-ghost">Cancel</button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
