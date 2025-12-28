import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <>
      <h1>Welcome {user?.username}</h1>
      <button onClick={logout}>Logout</button>
    </>
  );
};

export default Dashboard;
