import React from "react";
import { Link } from "react-router-dom";

const RoomCard = ({ room }) => {
  // Extract the repository name from the URL for the title
  const repoName = room.repoUrl.substring(room.repoUrl.lastIndexOf("/") + 1);

  return (
    <Link
      to={`/room/${room.roomId}`}
      className="block w-full rounded-xl overflow-hidden cursor-pointer border border-white/10 bg-white/5 backdrop-blur-sm shadow-sm hover:shadow-[0_2px_12px_rgba(201,171,117,0.35)] hover:scale-[1.03] transition-transform duration-300"
    >
      {/* Visual Placeholder (replaces the image from your example) */}
      <div className="relative w-full overflow-hidden bg-gradient-to-br from-primary/10 to-white/5">
        <div className="pt-[56.25%]" /> {/* 16:9 Aspect Ratio */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-orbitron text-primary/40 text-4xl select-none">
            ⌁
          </span>
        </div>
      </div>

      {/* Room ID Pill */}
      <span className="inline-block ml-5 mt-4 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs tracking-wide font-orbitron">
        ID: {room.roomId}
      </span>

      {/* Body */}
      <div className="p-5">
        <h3
          className="mb-2 font-orbitron text-white text-lg leading-snug truncate"
          title={repoName}
        >
          {repoName}
        </h3>
        <p
          className="text-xs text-slate-300 leading-relaxed truncate"
          title={room.repoUrl}
        >
          {room.repoUrl}
        </p>
      </div>
    </Link>
  );
};

export default RoomCard;
