import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 4) {
      return setError("Password must be at least 4 characters long.");
    }
    try {
      await register(email, username, password);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    }
  };

  return (
    <div className="flex items-center justify-center w-full min-h-screen p-4 sm:p-8 lg:p-12 font-sans relative overflow-hidden">
      {/* Background FX */}
      <div
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, rgba(17,100,102,0.2) 0%, transparent 70%)",
        }}
      ></div>
      <div
        className="absolute inset-0 z-0 opacity-5"
      ></div>

      {/* Register Card */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md lg:max-w-lg p-8 border  rounded-2xl bg-black/30 backdrop-blur-md shadow-2xl ">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl sm:text-4xl   tracking-widest drop-shadow-md">
            Register ⌁
          </h1>
          <p className="text-sm sm:text-base text-theme-tan">
            Create your account to join the mission.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 text-sm sm:text-base"
        >
          <div className="flex flex-col">
            <label className="">
              🛰 Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-b px-2 py-2 outline-none  transition-all duration-300 rounded-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className=" mb-1">
              🧑‍🚀 Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className=" border-b  placeholder-theme-tan px-2 py-2 outline-none  transition-all duration-300 rounded-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-theme-mint mb-1 font-sci-fi">
              🔒 Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-transparent border-b border-theme-teal/50 placeholder-theme-tan px-2 py-2 outline-none focus:border-theme-mint focus:ring-1 focus:ring-theme-mint transition-all duration-300 rounded-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 mt-4 font-semibold text-sm sm:text-base bg-theme-teal hover:bg-theme-mint text-theme-dark-bg rounded-lg tracking-wider uppercase transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg shadow-theme-teal/40 hover:shadow-theme-mint/50 border border-white border-opacity-80"
          >
            Register
          </button>
        </form>

        {error && (
          <p className="text-theme-peach text-sm sm:text-base text-center font-sci-fi mt-4">
            {error}
          </p>
        )}

        <p className="text-theme-tan text-xs sm:text-sm mt-6 text-center">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-theme-mint underline hover:text-theme-teal transition-colors duration-300"
          >
            Login here
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default Register;
