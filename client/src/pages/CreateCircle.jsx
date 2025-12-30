import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

export default function CreateCircle() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [visibility, setVisibility] = useState("public");

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "auto", padding: "20px" }}>
      <h2>Create Circle</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Circle Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <br /><br />
        <textarea
          placeholder="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
        />
        <br /><br />
        <input
          placeholder="Tags (comma separated)"
          value={tags}
          onChange={e => setTags(e.target.value)}
        />
        <br /><br />
        <select value={visibility} onChange={e => setVisibility(e.target.value)}>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
        <br /><br />
        <button type="submit">Create</button>
      </form>
    </div>
  );
}
