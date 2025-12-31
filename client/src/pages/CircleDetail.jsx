import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function CircleDetail() {
  const { id: circleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); 
  const [circle, setCircle] = useState(null);
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCoverImage, setSelectedCoverImage] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showCoverUpload, setShowCoverUpload] = useState(false);

  const isAdmin = circle?.admins?.some(
    admin => {
      const adminId = typeof admin === 'object' ? admin._id : admin;
      return adminId === user?._id || adminId === user?.id;
    }
  );

  /* ---------------- FETCH CIRCLE ---------------- */
  useEffect(() => {
    api
      .get(`/circles/${circleId}`)
      .then(res => {
        setCircle(res.data);
      })
      .catch(err => {
        console.error("Error fetching circle:", err);
        if (err.response?.status === 401) {
          navigate("/login");
        } else if (err.response?.status === 403) {
          alert("You need to join this circle first!");
          navigate("/circles");
        }
      });
  }, [circleId, navigate]);

  /* ---------------- FETCH POSTS ---------------- */
  useEffect(() => {
    if (!circle) return;
    
    api
      .get(`/posts/${circleId}`)
      .then(res => setPosts(res.data))
      .catch(err => {
        console.error("Error fetching posts:", err);
        if (err.response?.status === 403) {
          alert("You need to be a member to view posts");
        }
      });
  }, [circleId, circle]);

  /* ---------------- CREATE POST ---------------- */
  const createPost = async e => {
    e.preventDefault();

    try {
      await api.post(`/posts/${circleId}`, { title, content });
      const updatedPosts = await api.get(`/posts/${circleId}`);
      setPosts(updatedPosts.data);
      
      setTitle("");
      setContent("");
      alert("Post created successfully!");
    } catch (err) {
      console.error("Error creating post:", err);
      alert(err.response?.data?.message || "Failed to create post");
    }
  };

  /* ---------------- UPLOAD COVER IMAGE ---------------- */
  const handleCoverImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      setSelectedCoverImage(file);
    }
  };

  const uploadCoverImage = async () => {
    if (!selectedCoverImage) {
      alert("Please select an image first");
      return;
    }

    const formData = new FormData();
    formData.append('coverImage', selectedCoverImage);

    setUploadingCover(true);
    try {
      const res = await api.post(`/circles/${circleId}/cover-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setCircle({ ...circle, coverImage: res.data.coverImage });
      setSelectedCoverImage(null);
      setShowCoverUpload(false);
      alert("Cover image updated successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to upload cover image");
    } finally {
      setUploadingCover(false);
    }
  };

  const deleteCoverImage = async () => {
    if (!confirm("Are you sure you want to delete the cover image?")) return;

    try {
      await api.delete(`/circles/${circleId}/cover-image`);
      setCircle({ ...circle, coverImage: null });
      alert("Cover image deleted successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete cover image");
    }
  };

  if (!circle) return <p>Loading circle...</p>;

  return (
    <div style={{ maxWidth: 900, margin: "auto" }}>
      {/* Cover Image Section */}
      <div style={{ position: "relative", width: "100%", marginBottom: "20px" }}>
        {circle.coverImage ? (
          <div style={{ position: "relative" }}>
            <img
              src={circle.coverImage}
              alt="Circle cover"
              style={{
                width: "100%",
                height: "300px",
                objectFit: "cover",
                borderRadius: "12px"
              }}
            />
            {isAdmin && (
              <div style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                display: "flex",
                gap: "10px"
              }}>
                <button
                  onClick={() => setShowCoverUpload(true)}
                  style={{
                    padding: "8px 15px",
                    backgroundColor: "rgba(255,255,255,0.9)",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  📷 Change Cover
                </button>
                <button
                  onClick={deleteCoverImage}
                  style={{
                    padding: "8px 15px",
                    backgroundColor: "rgba(255,0,0,0.8)",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer"
                  }}
                >
                  🗑️ Remove
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{
            width: "100%",
            height: "200px",
            backgroundColor: "#f0f0f0",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column"
          }}>
            <p style={{ color: "#999", fontSize: "18px" }}>No cover image</p>
            {isAdmin && (
              <button
                onClick={() => setShowCoverUpload(true)}
                style={{
                  marginTop: "10px",
                  padding: "10px 20px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer"
                }}
              >
                📷 Add Cover Image
              </button>
            )}
          </div>
        )}
      </div>

      {/* Cover Image Upload Modal */}
      {showCoverUpload && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "10px",
            maxWidth: "500px",
            width: "90%"
          }}>
            <h3>Upload Cover Image</h3>
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverImageSelect}
              style={{ marginBottom: "15px" }}
            />
            {selectedCoverImage && (
              <p style={{ fontSize: "14px", color: "#666" }}>
                Selected: {selectedCoverImage.name}
              </p>
            )}
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={uploadCoverImage}
                disabled={!selectedCoverImage || uploadingCover}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: uploadingCover ? "not-allowed" : "pointer",
                  opacity: (!selectedCoverImage || uploadingCover) ? 0.6 : 1
                }}
              >
                {uploadingCover ? "Uploading..." : "Upload"}
              </button>
              <button
                onClick={() => {
                  setShowCoverUpload(false);
                  setSelectedCoverImage(null);
                }}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rest of the page */}
      <div style={{ padding: "20px" }}>
        <button onClick={() => navigate("/circles")}>← Back to Circles</button>
        
        {isAdmin && (
          <button
            onClick={() => navigate(`/circles/${circleId}/admin`)}
            style={{
              backgroundColor: "#007bff",
              color: "white",
              padding: "8px 15px",
              marginLeft: "10px"
            }}
          >
            ⚙️ Admin Dashboard
          </button>
        )}

        <h2>{circle.name}</h2>
        <p>{circle.description}</p>

        <hr />

        {/* -------- CREATE POST -------- */}
        <h3>Create Post</h3>
        <form onSubmit={createPost}>
          <input
            style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
            placeholder="Post title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <br />
          <textarea
            style={{ width: "100%", padding: "8px", marginBottom: "10px", minHeight: "100px" }}
            placeholder="Write something..."
            value={content}
            onChange={e => setContent(e.target.value)}
            required
          />
          <br />
          <button type="submit">Post</button>
        </form>

        <hr />

        {/* -------- POSTS -------- */}
        <h3>Posts</h3>

        {posts.length === 0 && <p>No posts yet. Be the first to post!</p>}

        {posts.map(post => (
          <PostItem key={post._id} post={post} />
        ))}
      </div>
    </div>
  );
}

/* ================= POST ITEM ================= */

function PostItem({ post }) {
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState("");

  useEffect(() => {
    api
      .get(`/comments/${post._id}`)
      .then(res => setComments(res.data))
      .catch(err => console.error("Error fetching comments:", err));
  }, [post._id]);

  const addComment = async e => {
    e.preventDefault();

    try {
      await api.post(`/comments/${post._id}`, { content: commentContent });
      const updatedComments = await api.get(`/comments/${post._id}`);
      setComments(updatedComments.data);
      
      setCommentContent("");
    } catch (err) {
      console.error("Error adding comment:", err);
      alert(err.response?.data?.message || "Failed to add comment");
    }
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: 15, marginBottom: 15, borderRadius: "5px" }}>
      <h4>{post.title}</h4>
      <p>{post.content}</p>
      <small style={{ color: "#666" }}>By {post.author?.username || post.author?.displayName || "Unknown"}</small>

      <div style={{ marginTop: 15, backgroundColor: "#f5f5f5", padding: "10px", borderRadius: "5px" }}>
        <b>Comments ({comments.length})</b>
        {comments.length > 0 && (
          <div style={{ marginTop: "10px" }}>
            {comments.map(c => (
              <p key={c._id} style={{ margin: "8px 0", paddingLeft: "10px", borderLeft: "3px solid #ccc" }}>
                <strong>{c.author?.username || c.author?.displayName || "Unknown"}:</strong> {c.content}
              </p>
            ))}
          </div>
        )}

        <form onSubmit={addComment} style={{ marginTop: "10px" }}>
          <input
            style={{ width: "calc(100% - 100px)", padding: "8px", marginRight: "5px" }}
            placeholder="Add a comment..."
            value={commentContent}
            onChange={e => setCommentContent(e.target.value)}
            required
          />
          <button type="submit" style={{ padding: "8px 15px" }}>Comment</button>
        </form>
      </div>
    </div>
  );
}