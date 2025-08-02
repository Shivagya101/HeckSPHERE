import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import CreateRoom from "../components/CreateRoom";
import JoinRoom from "../components/JoinRoom";
import RoomList from "../components/RoomList";

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  const handleLogout = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/logout`;
  };

  return (
    <div className="min-h-screen p-6 sm:p-8 md:p-12 text-white font-light bg-gradient-to-br from-[#1f1c2c] to-[#11172a]">
      <header className="max-w-7xl mx-auto mb-12 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <img
            src={user?.avatarUrl}
            alt="avatar"
            className="w-12 h-12 rounded-full border-2 border-primary/50"
          />
          <div>
            <p className="text-lg font-semibold font-orbitron text-primary">
              {user?.username}
            </p>
            <p className="text-xs text-slate-400">GitHub User</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="px-5 py-2 font-orbitron text-xs font-semibold text-red-400 uppercase tracking-wider bg-red-500/10 border border-red-500/30 rounded-lg transition-colors hover:bg-red-500/20 hover:text-red-300"
        >
          Logout
        </button>
      </header>

      <main className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <CreateRoom />
          <JoinRoom />
        </div>
        <RoomList />
      </main>
    </div>
  );
};

export default Dashboard;
