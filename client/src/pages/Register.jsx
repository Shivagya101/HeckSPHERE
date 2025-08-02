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
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-[#1f1c2c] to-[#11172a] text-slate-200 font-light">
      <div className="w-full max-w-md p-8 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-md shadow-lg shadow-primary/10">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-orbitron text-primary tracking-widest">
            Register ⌁
          </h1>
          <p className="text-sm text-slate-400">
            Create your account to join the mission.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-sm">
          <div className="flex flex-col">
            <label className="text-slate-300 mb-1 font-mono">
              🛰 Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent border-b border-primary/20 placeholder-slate-400 px-2 py-2 outline-none focus:border-primary transition"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-slate-300 mb-1 font-mono">🧑‍🚀 Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-transparent border-b border-primary/20 placeholder-slate-400 px-2 py-2 outline-none focus:border-primary transition"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-slate-300 mb-1 font-mono">🔒 Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-transparent border-b border-primary/20 placeholder-slate-400 px-2 py-2 outline-none focus:border-primary transition"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 mt-4 font-semibold text-sm bg-primary/80 hover:bg-primary text-black rounded-lg tracking-wider uppercase transition-all"
          >
            Register
          </button>
        </form>

        {error && (
          <p className="text-red-400 text-sm text-center font-mono mt-4">
            {error}
          </p>
        )}

        <p className="text-slate-400 text-xs mt-6 text-center">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary underline hover:text-primary/80 transition"
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
