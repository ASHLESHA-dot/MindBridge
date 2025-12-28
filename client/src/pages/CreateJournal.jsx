import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const CreateJournal = () => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState("private");
  const navigate = useNavigate();

  const submitJournal = async () => {
    await api.post("/journals", { title, body, visibility });
    navigate("/journals");
  };

  return (
    <div>
      <h2>New Journal</h2>

      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        placeholder="Write..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
        <option value="private">Private</option>
        <option value="public">Public</option>
      </select>

      <button onClick={submitJournal}>Save</button>
    </div>
  );
};

export default CreateJournal;
