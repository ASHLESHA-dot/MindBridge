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
const [requests, setRequests] = useState([]);
  const isAdmin = circle?.admins?.some(
    adminId => adminId === user?.id
  );
{isAdmin && (
  <div>
    <h3>Join Requests</h3>
    {requests.map(u => (
      <div key={u._id}>
        {u.displayName || u.username}
        <button onClick={() => approve(u._id)}>Approve</button>
        <button onClick={() => reject(u._id)}>Reject</button>
      </div>
    ))}
  </div>
)}

  /* ---------------- FETCH CIRCLE ---------------- */
  useEffect(() => {
    api
      .get(`/circles/${circleId}`)
      .then(res => 
        
        {
      console.log("Circle data:", res.data); // ADD THIS
      console.log("Current user:", user); // ADD THIS
      console.log("Circle admins:", res.data.admins); // ADD THIS
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
      const res = await api.post(`/posts/${circleId}`, { title, content });

      // Refetch all posts to get updated list with populated author
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

  if (!circle) return <p>Loading circle...</p>;

  return (
    <div style={{ maxWidth: 700, margin: "auto", padding: "20px" }}>
      <button onClick={() => navigate("/circles")}>← Back to Circles</button>
      {circle && user && (
  circle.admins?.some(admin => {
    // Handle both populated objects and plain IDs
    const adminId = typeof admin === 'object' ? admin._id : admin;
    return adminId === user._id || adminId === user.id;
  })
) && (
  <button
    onClick={() => navigate(`/circles/${circleId}/admin`)}
    style={{
      backgroundColor: "#007bff",
      color: "white",
      padding: "8px 15px"
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
  );
}

/* ================= POST ITEM ================= */

function PostItem({ post }) {
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState(""); // Changed from "text" to "commentContent"

  useEffect(() => {
    api
      .get(`/comments/${post._id}`)
      .then(res => setComments(res.data))
      .catch(err => console.error("Error fetching comments:", err));
  }, [post._id]);

  const addComment = async e => {
    e.preventDefault();

    try {
      // Send as "content" to match backend
      const res = await api.post(`/comments/${post._id}`, { content: commentContent });

      // Refetch comments to get populated author
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
      // Add this after the circle name in CircleDetail.jsx

    </div>
  );
}