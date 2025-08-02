import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import RoomCard from "./RoomCard"; // Import the new card component

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { api } = useContext(AuthContext);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const { data } = await api.get("/api/rooms");
        setRooms(data);
      } catch (err) {
        setError("Failed to fetch rooms.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [api]);

  return (
    <div className="mt-12">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-orbitron text-primary tracking-widest">
          Your Rooms ⌁
        </h2>
        <p className="text-sm text-slate-400">
          Select a space to continue your mission.
        </p>
      </div>

      {loading && (
        <p className="text-center text-slate-400 mt-8">Loading your rooms...</p>
      )}
      {error && <p className="text-center text-red-400 mt-8">{error}</p>}

      {!loading &&
        !error &&
        (rooms.length === 0 ? (
          <div className="text-center text-slate-300 mt-8 p-8 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-md">
            You haven't joined any rooms yet.
          </div>
        ) : (
          // Use a responsive grid instead of a <ul>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 mt-10">
            {rooms.map((room) => (
              <RoomCard key={room._id} room={room} />
            ))}
          </div>
        ))}
    </div>
  );
};

export default RoomList;
