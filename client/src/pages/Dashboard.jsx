import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // ADD THIS IMPORT
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate(); // ADD THIS LINE
  const [moods, setMoods] = useState([]);

  useEffect(() => {
    const fetchMoods = async () => {
      const res = await api.get("/moods");
      setMoods(res.data);
    };
    fetchMoods();
  }, []);

  const todayMood = moods[0]; // latest first
  
  const addMood = async (mood) => {
    await api.post("/moods", { mood });
    const res = await api.get("/moods");
    setMoods(res.data);
  };

  const handleLogout = () => {
    if(confirm("are you sure want to log out?")) {
      logout();
      navigate("/login");
    }
  };

  return (
    <div>
      <h1>Welcome, {user?.username}</h1>

      <h3>Today's Mood</h3>
      {todayMood ? (
        <p>{todayMood.mood}</p>
      ) : (
        <p>No mood logged today</p>
      )}

      <div>
        <button onClick={() => addMood("good")}>Good 😊</button>
        <button onClick={() => addMood("neutral")}>Neutral 😐</button>
        <button onClick={() => addMood("bad")}>Bad 😔</button>
      </div>

      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Dashboard;