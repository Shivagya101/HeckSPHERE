import { useState } from "react";

export default function CreateRoom() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [roomId, setRoomId] = useState("");
  const [created, setCreated] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setRoomId("");
    setCreated(false);

    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/room/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
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
      if (!data.roomId) {
        throw new Error("Invalid response from server");
      }

      setRoomId(data.roomId);
      setCreated(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div className="relative min-h-screen px-6 md:px-24 pt-24 pb-16 text-white font-light overflow-hidden bg-gradient-to-br from-[#0c0f1a] via-[#121627] to-[#0c0c17]">
      <img
        src="/ambient-bg.svg"
        alt=""
        className="absolute inset-0 -z-10 opacity-30 pointer-events-none blur-sm"
      />

      <div className="max-w-xl mx-auto bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-10 shadow-xl">
        <h1 className="text-center text-4xl md:text-5xl text-yellow-200 font-semibold mb-10 tracking-wider drop-shadow font-orbitron">
          Create a Room
        </h1>

        {!created && (
          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <label className="block text-yellow-300/80 text-xs font-mono tracking-widest uppercase mb-1">
                Room Password
              </label>
              <input
                type="password"
                required
                minLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-md bg-[#11172a] border border-yellow-300/20 text-yellow-100 placeholder-slate-400 font-light focus:outline-none focus:ring-1 focus:ring-yellow-300"
                placeholder="Set a password"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-[#c1a469] text-black font-orbitron text-sm tracking-wide rounded-md shadow hover:brightness-110 transition disabled:opacity-60"
            >
              {loading ? "Creating..." : "Transmit to OrbitNet"}
            </button>
          </form>
        )}

        {error && (
          <p className="text-red-400 text-sm text-center font-mono mt-4">
            {error}
          </p>
        )}

        {created && roomId && (
          <div className="mt-10 text-center space-y-4">
            <p className="text-green-400 font-mono text-sm">
              ✅ Room successfully created!
            </p>
            <div className="flex flex-col gap-2 items-center">
              <div className="text-yellow-200 font-mono text-base">
                Room ID:{" "}
                <span className="bg-[#1a1f34] px-3 py-1 rounded-md border border-yellow-300/30 flex items-center gap-2">
                  {roomId}
                  <button
                    onClick={() => copy(roomId)}
                    className="ml-2 text-xs bg-white/10 px-2 py-1 rounded"
                  >
                    Copy
                  </button>
                </span>
              </div>
              <div className="text-yellow-200 font-mono text-base">
                Password:{" "}
                <span className="bg-[#1a1f34] px-3 py-1 rounded-md border border-yellow-300/30 flex items-center gap-2">
                  {password}
                  <button
                    onClick={() => copy(password)}
                    className="ml-2 text-xs bg-white/10 px-2 py-1 rounded"
                  >
                    Copy
                  </button>
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-300">
              Share these credentials with collaborators. They will use the room
              ID, password, and their own username on the Join page to enter.
            </p>
          </div>
        )}

        <p className="text-slate-400 text-xs mt-10 text-center">
          Already have a room?{" "}
          <a
            href="/join"
            className="text-yellow-300 underline hover:text-yellow-200 transition"
          >
            Join it here
          </a>
          .
        </p>
      </div>
    </div>
  );
}
