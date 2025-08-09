import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    }
  };

  return (
    // Main container with the dark background from the theme.
    // Increased padding for larger screens and subtle background gradient for depth.
    // Added 'w-full' to ensure the flex container explicitly takes full width for centering.
    <div className="flex items-center justify-center w-full min-h-screen p-4 sm:p-8 lg:p-12 bg-cyber-pink-bg text-theme-mint font-sans relative overflow-hidden">
      {/* Optional: Add a subtle background pattern or glow effect for sci-fi feel */}
      <div
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, rgba(17,100,102,0.2) 0%, transparent 70%)",
        }}
      ></div>
      <div
        className="absolute inset-0 z-0 opacity-5"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.1' fill-rule='evenodd'%3E%3Cpath d='M5 0h1L0 6V5zM6 5v1H5z'/%3E%3C/g%3E%3C/svg%3E\")",
        }}
      ></div>

      {/* Login card container. Adjusted max-width for better laptop display. */}
      {/* Added a more pronounced border and shadow for a glowing effect. */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md lg:max-w-lg p-8 border border-theme-teal/50 rounded-2xl bg-black/30 backdrop-blur-md shadow-2xl shadow-theme-teal/30 transition-all duration-300 hover:shadow-theme-mint/40">
        <div className="text-center space-y-2 mb-8">
          {/* Title with sci-fi font and mint color */}
          <h1 className="text-3xl sm:text-4xl font-sci-fi text-theme-mint tracking-widest drop-shadow-md shadow-theme-mint">
            Login ⌁
          </h1>
          {/* Subtitle text */}
          <p className="text-sm sm:text-base text-theme-tan">
            Authenticate to begin your mission.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 text-sm sm:text-base"
        >
          <div className="flex flex-col">
            {/* Email label */}
            <label className="text-theme-mint mb-1 font-sci-fi">
              🛰 Email Address
            </label>
            {/* Email input field. Enhanced focus styles for a glowing effect. */}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent border-b border-theme-teal/50 placeholder-theme-tan px-2 py-2 outline-none focus:border-theme-mint focus:ring-1 focus:ring-theme-mint transition-all duration-300 rounded-sm"
            />
          </div>
          <div className="flex flex-col">
            {/* Password label */}
            <label className="text-theme-mint mb-1 font-sci-fi">
              🔒 Password
            </label>
            {/* Password input field. Enhanced focus styles. */}
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-transparent border-b border-theme-teal/50 placeholder-theme-tan px-2 py-2 outline-none focus:border-theme-mint focus:ring-1 focus:ring-theme-mint transition-all duration-300 rounded-sm"
            />
          </div>
          {/* Submit button. More prominent hover effect and subtle glow. */}
          <button
            type="submit"
            className="w-full py-3 mt-4 font-semibold text-sm sm:text-base bg-theme-teal hover:bg-theme-mint text-theme-dark-bg rounded-lg tracking-wider uppercase transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg shadow-theme-teal/40 hover:shadow-theme-mint/50 border border-white border-opacity-80"
          >
            Login
          </button>
        </form>

        {error && (
          // Error message with a more distinct color
          <p className="text-theme-peach text-sm sm:text-base text-center font-sci-fi mt-4">
            {error}
          </p>
        )}

        {/* Register link */}
        <p className="text-theme-tan text-xs sm:text-sm mt-6 text-center">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-theme-mint underline hover:text-theme-teal transition-colors duration-300"
          >
            Register here
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default Login;
