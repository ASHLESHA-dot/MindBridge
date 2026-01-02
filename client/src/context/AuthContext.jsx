import { createContext, useContext, useState } from "react";
import api from "../services/api"; //Use this instead of axios

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  // Helper function to update user and sync with localStorage
  const setUser = (userData) => {
    try {
      setUserState(userData);
      if (userData) {
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        localStorage.removeItem("user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password }); //  Changed
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
  };

  const signup = async (username, email, password) => {
    const res = await api.post("/auth/signup", { //  Changed
      username,
      email,
      password,
    });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.clear();
    setUserState(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);