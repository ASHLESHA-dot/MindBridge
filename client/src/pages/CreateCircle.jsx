import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

export default function CreateCircle() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/circles", {
        name,
        description,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        visibility
      });
      navigate(`/circles/${res.data._id}`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create circle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}> Create a New Circle</h2>
        <p style={styles.subtitle}>
          Build a space where people can connect and share
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Circle Name */}
          <label style={styles.label}>Circle Name</label>
          <input
            style={styles.input}
            placeholder="e.g. Mindfulness Group"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />

          {/* Description */}
          <label style={styles.label}>Description</label>
          <textarea
            style={{ ...styles.input, ...styles.textarea }}
            placeholder="What is this circle about?"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
          />

          {/* Tags */}
          <label style={styles.label}>Tags</label>
          <input
            style={styles.input}
            placeholder="mental health, journaling, growth"
            value={tags}
            onChange={e => setTags(e.target.value)}
          />
          <small style={styles.helperText}>
            Separate tags with commas
          </small>

          {/* Visibility */}
          <label style={styles.label}>Visibility</label>
          <select
            style={styles.select}
            value={visibility}
            onChange={e => setVisibility(e.target.value)}
          >
            <option value="public"> Public – anyone can join</option>
            <option value="private"> Private – approval required</option>
          </select>

          {/* Actions */}
          <div style={styles.actions}>
            <button
              type="button"
              onClick={() => navigate("/circles")}
              style={styles.cancelBtn}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              style={{
                ...styles.submitBtn,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer"
              }}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Circle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #e3f2fd, #f9f9f9)",
    padding: "20px"
  },
  card: {
    width: "100%",
    maxWidth: "520px",
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "30px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
  },
  title: {
    margin: 0,
    marginBottom: "6px",
    fontSize: "26px",
    fontWeight: "700",
    textAlign: "center"
  },
  subtitle: {
    margin: 0,
    marginBottom: "24px",
    textAlign: "center",
    color: "#666",
    fontSize: "14px"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#333"
  },
  input: {
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "15px",
    outline: "none"
  },
  textarea: {
    minHeight: "90px",
    resize: "vertical"
  },
  select: {
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "15px",
    backgroundColor: "white",
    cursor: "pointer"
  },
  helperText: {
    fontSize: "12px",
    color: "#777",
    marginTop: "-6px"
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "20px",
    gap: "10px"
  },
  cancelBtn: {
    flex: 1,
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    backgroundColor: "#f5f5f5",
    cursor: "pointer",
    fontWeight: "600"
  },
  submitBtn: {
    flex: 1,
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#007bff",
    color: "white",
    fontWeight: "600"
  }
};
