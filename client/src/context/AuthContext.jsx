import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

// Create an Axios instance for API calls
const api = axios.create({
  baseURL: "http://localhost:5000", // Your server URL
  withCredentials: true, // Important for sending session cookies
});

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const { data } = await api.get("/auth/me");
        setUser(data);
      } catch (error) {
        console.log("User not logged in");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkLoggedIn();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, api }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
