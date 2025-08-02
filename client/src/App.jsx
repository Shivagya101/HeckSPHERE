import React, { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";

// Import Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard"; // We will create this next
import RoomPage from "./pages/RoomPage";

// Import Components
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading Application...</div>;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" /> : <Login />}
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

          {/* Default route redirects to dashboard if logged in, otherwise to login */}
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
