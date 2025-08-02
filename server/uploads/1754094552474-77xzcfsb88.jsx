import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function JoinRoom() {
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    e.preventDefault();
    setError("");

    if (!roomId.trim()) {
      setError("Room ID is required.");
      return;
    }
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/room/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: roomId.trim(),
          password,
          username: username.trim(),
        }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Expected JSON but got: ${text.slice(0, 200)}`);
      }

      if (!res.ok) {
        throw new Error(data.error || `Server error ${res.status}`);
      }

      if (!data.roomId || !data.token) {
        throw new Error("Invalid response from server");
      }

      localStorage.setItem("roomToken", data.token);
      navigate(`/room/${data.roomId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen px-6 md:px-24 pt-24 pb-16 text-white font-light overflow-hidden bg-gradient-to-br from-[#0a0b12] via-[#15131f] to-[#1b182a]">
      <img
        src="/ambient-bg.svg"
        alt=""
        className="absolute inset-0 -z-10 opacity-30 pointer-events-none blur-sm"
      />

      <div className="max-w-xl mx-auto bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-10 shadow-xl">
        <h1 className="text-center text-4xl md:text-5xl text-yellow-200 font-semibold mb-10 tracking-wider drop-shadow font-orbitron">
          Join a Room
        </h1>

        <form onSubmit={handleJoin} className="space-y-6">
          <div>
            <label className="block text-yellow-300/80 text-xs font-mono tracking-widest uppercase mb-1">
              Room ID
            </label>
            <input
              type="text"
              required
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full px-4 py-3 rounded-md bg-[#11172a] border border-yellow-300/20 text-yellow-100 placeholder-slate-400 font-light focus:outline-none focus:ring-1 focus:ring-yellow-300"
              placeholder="Enter room ID"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-yellow-300/80 text-xs font-mono tracking-widest uppercase mb-1">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-md bg-[#11172a] border border-yellow-300/20 text-yellow-100 placeholder-slate-400 font-light focus:outline-none focus:ring-1 focus:ring-yellow-300"
              placeholder="Your display name"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-yellow-300/80 text-xs font-mono tracking-widest uppercase mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-md bg-[#11172a] border border-yellow-300/20 text-yellow-100 placeholder-slate-400 font-light focus:outline-none focus:ring-1 focus:ring-yellow-300"
              placeholder="Room password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-[#c1a469] text-black font-orbitron text-sm tracking-wide rounded-md shadow hover:brightness-110 transition disabled:opacity-60"
          >
            {loading ? "Joining…" : "Join Room"}
          </button>
        </form>

        {error && (
          <p className="text-red-400 text-sm text-center font-mono mt-2">
            {error}
          </p>
        )}

        <p className="text-slate-400 text-xs mt-10 text-center">
          Need to create a room?{" "}
          <a
            href="/create"
            className="text-yellow-300 underline hover:text-yellow-200 transition"
          >
            Create it here
          </a>
        </p>
      </div>
    </div>
  );
}
