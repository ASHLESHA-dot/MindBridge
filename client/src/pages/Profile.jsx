import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

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
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadPicture = async () => {
    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }

    const formData = new FormData();
    formData.append('profilePicture', selectedFile);

    setUploading(true);
    try {
      const res = await api.post("/auth/profile-picture", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const newProfilePicture = res.data.profilePicture;
      
      if (!newProfilePicture) {
        throw new Error("No profile picture URL received from server");
      }

      // Update local state first
      setProfilePicture(newProfilePicture);
      setSelectedFile(null);
      setPreviewUrl("");
      
      // Update user context AND localStorage in try-catch
      try {
        const updatedUser = { ...user, profilePicture: newProfilePicture };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } catch (updateError) {
        console.error("Error updating user context:", updateError);
        // Still show success since upload worked
      }
      
      alert("Profile picture updated successfully!");
    } catch (err) {
      console.error("Upload error details:", err);
      console.error("Error response:", err.response);
      console.error("Error message:", err.message);
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
      
      // Update user context AND localStorage
      const updatedUser = { ...user, profilePicture: res.data.profilePicture };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser)); // FIX: Save to localStorage
      
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
        interests: interests.split(",").map(i => i.trim()).filter(Boolean)
      });
      
      // Update user context AND localStorage
      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data)); // FIX: Save to localStorage
      
      alert("Profile updated successfully!");
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update profile");
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: "20px" }}>
      <h2>Edit Profile</h2>

      {/* Profile Picture Section */}
      <div style={{ 
        textAlign: "center", 
        marginBottom: "30px", 
        padding: "20px", 
        backgroundColor: "#f9f9f9",
        borderRadius: "8px"
      }}>
        <h3>Profile Picture</h3>
        
        <img
          src={previewUrl || profilePicture || "https://via.placeholder.com/150"}
          alt="Profile"
          style={{
            width: "150px",
            height: "150px",
            borderRadius: "50%",
            objectFit: "cover",
            border: "3px solid #ddd",
            marginBottom: "15px"
          }}
        />

        <div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ marginBottom: "10px" }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          {selectedFile && (
            <button
              onClick={handleUploadPicture}
              disabled={uploading}
              style={{
                backgroundColor: "#4CAF50",
                color: "white",
                padding: "8px 15px",
                border: "none",
                borderRadius: "5px",
                cursor: uploading ? "not-allowed" : "pointer"
              }}
            >
              {uploading ? "Uploading..." : "Upload New Picture"}
            </button>
          )}

          {profilePicture && !profilePicture.includes('ui-avatars.com') && (
            <button
              onClick={handleDeletePicture}
              style={{
                backgroundColor: "#f44336",
                color: "white",
                padding: "8px 15px",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              Delete Picture
            </button>
          )}
        </div>

        <p style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>
          Max file size: 5MB. Supported formats: JPG, PNG, GIF
        </p>
      </div>

      <hr />

      {/* Profile Info Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label>Display Name:</label>
          <input
            style={{ width: "100%", padding: "8px" }}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Bio:</label>
          <textarea
            style={{ width: "100%", padding: "8px", minHeight: "100px" }}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Interests (comma-separated):</label>
          <input
            style={{ width: "100%", padding: "8px" }}
            placeholder="anxiety, mindfulness, productivity"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
          />
        </div>

        <button type="submit" style={{ marginRight: "10px" }}>
          Save Profile
        </button>
        <button type="button" onClick={() => navigate("/")} style={{ backgroundColor: "#999" }}>
          Cancel
        </button>
      </form>
    </div>
  );
}