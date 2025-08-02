import React, { useState, useEffect, useContext } from "react";
import { useAuth } from "../context/AuthContext";

const RepoCommits = ({ roomId }) => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { api } = useAuth();

  // Step 1: Fetch all branches when the component loads
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/rooms/${roomId}/commits/branches`);
        setBranches(data);
        if (data.length > 0) {
          setSelectedBranch(data[0]);
        }
      } catch (err) {
        setError("Failed to fetch branches.");
      } finally {
        setLoading(false);
      }
    };
    fetchBranches();
  }, [roomId, api]);

  // Step 2: Fetch commits whenever the selected branch changes
  useEffect(() => {
    if (!selectedBranch) return;

    const fetchCommits = async () => {
      try {
        setLoading(true);
        setError(""); // Clear previous errors
        setCommits([]); // Clear old commits before fetching new ones
        const { data } = await api.get(`/api/rooms/${roomId}/commits`, {
          params: { branch: selectedBranch },
        });
        setCommits(data);
      } catch (err) {
        setError("Failed to fetch commits for this branch.");
        setCommits([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCommits();
  }, [selectedBranch, roomId, api]);

  return (
    <div className="border border-white/10 rounded-2xl bg-white/5 backdrop-blur-md shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        {/* STYLE: Use the theme's 'primary' color */}
        <h2 className="text-2xl font-orbitron text-primary tracking-widest">
          Commits ⌁
        </h2>
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          disabled={loading || branches.length === 0}
          // STYLE: Use the theme's 'primary' color
          className="bg-transparent border-b border-primary/20 text-primary text-sm p-2 outline-none focus:border-primary transition"
        >
          {branches.map((branchName) => (
            <option key={branchName} value={branchName}>
              {branchName}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {loading && <p className="text-center text-slate-400">Loading...</p>}
        {error && <p className="text-center text-red-400">{error}</p>}
        {!loading &&
          !error &&
          commits.map((commit) => (
            <div key={commit.sha} className="bg-black/20 p-3 rounded-lg">
              {/* FIX: Check if commit.message exists before splitting to prevent crash */}
              <p className="text-sm text-slate-200 truncate">
                {commit.message && commit.message.split("\n")[0]}
              </p>
              <div className="mt-2 flex items-center">
                {commit.avatar && (
                  <img
                    src={commit.avatar}
                    alt={commit.author}
                    className="w-5 h-5 rounded-full mr-2"
                  />
                )}
                <span className="text-xs text-slate-500 font-mono">
                  {commit.author} on{" "}
                  {new Date(commit.date).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default RepoCommits;
