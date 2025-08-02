import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const RepoCommits = ({ roomId }) => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { api } = useContext(AuthContext);

  // Step 1: Fetch all branches when the component loads
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/rooms/${roomId}/commits/branches`);
        setBranches(data);
        if (data.length > 0) {
          // Automatically select the first branch (often 'main' or 'master')
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
        const { data } = await api.get(`/api/rooms/${roomId}/commits`, {
          params: { branch: selectedBranch }, // Pass branch as a query param
        });
        setCommits(data);
      } catch (err) {
        setError("Failed to fetch commits for this branch.");
        setCommits([]); // Clear old commits on error
      } finally {
        setLoading(false);
      }
    };
    fetchCommits();
  }, [selectedBranch, roomId, api]);

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-orbitron text-gold-300 uppercase tracking-wide">
          Recent Commits
        </h2>
        {/* Branch Selection Dropdown */}
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          disabled={loading || branches.length === 0}
          className="bg-[#11172a] border border-yellow-300/20 text-yellow-100 text-sm rounded-md p-2 focus:ring-1 focus:ring-yellow-300"
        >
          {branches.map((branchName) => (
            <option key={branchName} value={branchName}>
              {branchName}
            </option>
          ))}
        </select>
      </div>

      {/* Commits List */}
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {loading && <p className="text-center text-gray-400">Loading...</p>}
        {error && <p className="text-center text-red-400">{error}</p>}
        {!loading &&
          !error &&
          commits.map((commit) => (
            <div
              key={commit.sha}
              className="bg-[#11172a] p-3 rounded-lg border border-yellow-300/10"
            >
              <p className="text-sm font-mono text-yellow-100 truncate">
                {commit.message.split("\n")[0]}
              </p>
              <div className="mt-2 flex items-center">
                {commit.avatar && (
                  <img
                    src={commit.avatar}
                    alt={commit.author}
                    className="w-5 h-5 rounded-full mr-2"
                  />
                )}
                <span className="text-xs text-gray-400">
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
