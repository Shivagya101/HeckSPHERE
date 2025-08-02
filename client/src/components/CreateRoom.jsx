import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function CreateRoom() {
  const [repoUrl, setRepoUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { api } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");

    if (!repoUrl.startsWith("https://github.com/")) {
      setError("Please enter a valid GitHub repository URL.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/rooms/create", { repoUrl });
      if (res.data?.roomId) {
        navigate(`/room/${res.data.roomId}`);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "Failed to create room."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    // UPDATED: Container styles to match example
    <div className="w-full border border-white/10 rounded-2xl bg-white/5 backdrop-blur-md shadow-lg p-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-orbitron text-primary tracking-widest">
          Create Room ⌁
        </h2>
        <p className="text-sm text-slate-400">
          Launch a new collaboration space.
        </p>
      </div>

      <form onSubmit={handleCreate} className="mt-8 space-y-6 text-sm">
        <div className="flex flex-col">
          <label className="text-slate-300 mb-1 font-mono">
            🛰️ GitHub Repo URL
          </label>
          <input
            type="url"
            required
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            disabled={loading}
            // UPDATED: Input styles to be transparent with bottom border
            className="bg-transparent border-b border-primary/20 placeholder-slate-400 px-2 py-2 outline-none focus:border-primary transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          // UPDATED: Button styles to match example
          className="w-full py-3 mt-4 font-semibold text-sm bg-primary/80 hover:bg-primary text-black rounded-lg tracking-wider uppercase transition-all disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create & Enter"}
        </button>
      </form>

      {error && (
        <p className="text-red-400 text-sm text-center font-mono mt-4">
          {error}
        </p>
      )}
    </div>
  );
}
