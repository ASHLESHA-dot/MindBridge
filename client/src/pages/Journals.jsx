import { useEffect, useState } from "react";
import api from "../services/api";

const Journals = () => {
  const [journals, setJournals] = useState([]);

  useEffect(() => {
    const fetchJournals = async () => {
      const res = await api.get("/journals");
      setJournals(res.data);
    };
    fetchJournals();
  }, []);

  return (
    <div>
      <h2>My Journals</h2>

      {journals.length === 0 && <p>No journal entries yet</p>}

      {journals.map((j) => (
        <div key={j._id} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
          <h3>{j.title}</h3>
          <p>{j.body}</p>
          <small>
            {new Date(j.createdAt).toLocaleDateString()} | {j.visibility}
          </small>
        </div>
      ))}
    </div>
  );
};

export default Journals;
