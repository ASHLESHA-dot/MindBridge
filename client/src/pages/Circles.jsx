import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Circles = () => {
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  const viewCircle = (id) => {
    navigate(`/circles/${id}`);
  };

  if (loading) return <p>Loading circles...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Circles</h2>

      {circles.map((circle) => (
        <div key={circle._id} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10, borderRadius: "5px" }}>
          <h3>{circle.name}</h3>
          <p>{circle.description}</p>
          <button 
            onClick={() => joinCircle(circle._id)}
            style={{ marginRight: "10px", padding: "8px 15px" }}
          >
            Join
          </button>
          <button 
            onClick={() => viewCircle(circle._id)}
            style={{ padding: "8px 15px" }}
          >
            View Circle →
          </button>
        </div>
      ))}
    </div>
  );
};

export default Circles;