import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <h1>Welcome {user?.username}</h1>
      <button onClick={handleLogout}>Logout</button>
    </>
  );
};

export default Dashboard;
