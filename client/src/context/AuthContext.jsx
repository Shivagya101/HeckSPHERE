import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

// Create a reusable Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

const AuthContext = createContext();

// Custom hook to use the context easily
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        localStorage.setItem("token", token);
        // Set the token for all future Axios requests
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        try {
          const { data } = await api.get("/auth/me");
          setUser(data);
        } catch (error) {
          console.error("Token verification failed", error);
          logout(); // Clear invalid token
        }
      }
      setLoading(false);
    };
    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    setUser(data.user);
    setToken(data.token);
  };

  const register = async (email, username, password) => {
    const { data } = await api.post("/auth/register", {
      email,
      username,
      password,
    });
    setUser(data.user);
    setToken(data.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
  };

  const value = {
    user,
    token,
    loading,
    api, // Provide the configured axios instance
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
