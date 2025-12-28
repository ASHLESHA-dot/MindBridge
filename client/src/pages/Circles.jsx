import { useEffect, useState } from "react";
import api from "../services/api";

const Circles = () => {
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCircles = async () => {
      const res = await api.get("/circles");
      setCircles(res.data);
      setLoading(false);
    };
    fetchCircles();
  }, []);

  const joinCircle = async (id) => {
    try {
      await api.post(`/circles/${id}/join`);
      alert("Joined circle");
    } catch (err) {
      alert(err.response?.data?.message || "Error joining");
    }
  };

  if (loading) return <p>Loading circles...</p>;

  return (
    <div>
      <h2>Circles</h2>

      {circles.map((circle) => (
        <div key={circle._id} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
          <h3>{circle.name}</h3>
          <p>{circle.description}</p>
          <button onClick={() => joinCircle(circle._id)}>
            Join
          </button>
        </div>
      ))}
    </div>
  );
};

export default Circles;
