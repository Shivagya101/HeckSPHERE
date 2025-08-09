import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register"; // Import the new Register page
import Dashboard from "./pages/Dashboard";
import RoomPage from "./pages/RoomPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-theme-dark-bg text-theme-mint font-sci-fi text-xl">
        <p>Loading Application...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {/* Apply the main theme background to the entire app container */}
      <div className="min-h-screen flex justify-center bg-theme-dark-bg">
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" /> : <Login />}
          />

          {/* ADDED: Route for the new Register page */}
          <Route
            path="/register"
            element={user ? <Navigate to="/dashboard" /> : <Register />}
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/room/:roomId"
            element={
              <ProtectedRoute>
                <RoomPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={<Navigate to={user ? "/dashboard" : "/login"} />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
