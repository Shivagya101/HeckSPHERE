import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

// Format seconds as MM:SS
const formatTime = (sec) => {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);

  const [note, setNote] = useState("");
  const [lastEditor, setLastEditor] = useState(null);
  const noteTimeout = useRef(null);

  const [chatMessages, setChatMessages] = useState([]);
  const chatInputRef = useRef();
  const initialChatLoaded = useRef(false);

  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const [files, setFiles] = useState([]);
  const fileInputRef = useRef();

  const [error, setError] = useState("");

  const mergeChatMessages = (history) => {
    setChatMessages((prev) => {
      const existingIds = new Set(
        prev.map((m) => `${m.from}-${m.timestamp}-${m.text}`)
      );
      return [
        ...history.filter(
          (m) => !existingIds.has(`${m.from}-${m.timestamp}-${m.text}`)
        ),
        ...prev,
      ];
    });
  };

  useEffect(() => {
    const token = localStorage.getItem("roomToken");
    if (!token) return navigate("/join");

    const fetchChatHistory = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE}/room/${roomId}/chat`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.ok) {
          const history = await res.json();
          mergeChatMessages(history);
        }
      } catch {
      } finally {
        initialChatLoaded.current = true;
      }
    };

    const fetchFiles = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE}/room/${roomId}/files`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.ok) setFiles(await res.json());
      } catch {}
    };

    fetchChatHistory();
    fetchFiles();

    const socketUrl = import.meta.env.VITE_API_BASE.replace("/api", "");
    const s = io(socketUrl, { auth: { token } });

    s.on("connect_error", (err) =>
      setError("Socket connection failed: " + err.message)
    );
    s.on("notes:init", ({ content, lastEditor }) => {
      setNote(content || "");
      setLastEditor(lastEditor || null);
    });
    s.on("notes:update", ({ content, from }) => {
      setNote(content);
      setLastEditor(from);
    });
    s.on("chat:message", (msg) => {
      setChatMessages((prev) => {
        if (
          prev.length &&
          prev[prev.length - 1].from === msg.from &&
          prev[prev.length - 1].text === msg.text &&
          prev[prev.length - 1].timestamp === msg.timestamp
        )
          return prev;
        return [...prev, msg];
      });
    });
    s.on("timer:update", ({ time, active }) => {
      setTimer(time);
      setTimerActive(active);
    });
    s.on("file:uploaded", (meta) => {
      setFiles((prev) =>
        prev.find((f) => f._id === meta._id) ? prev : [meta, ...prev]
      );
    });

    setSocket(s);
    return () => {
      if (noteTimeout.current) clearTimeout(noteTimeout.current);
      s.disconnect();
    };
  }, [roomId, navigate]);

  const emitNote = useCallback(
    (value) => {
      if (socket) socket.emit("notes:update", value);
    },
    [socket]
  );

  const handleNoteChange = (e) => {
    setNote(e.target.value);
    if (noteTimeout.current) clearTimeout(noteTimeout.current);
    noteTimeout.current = setTimeout(() => emitNote(e.target.value), 300);
  };

  const sendChat = () => {
    const text = chatInputRef.current?.value?.trim();
    if (!text || !socket) return;
    socket.emit("chat:message", { text });
    chatInputRef.current.value = "";
  };

  const startTimer = (durationSeconds) =>
    socket?.emit("timer:start", { duration: durationSeconds });
  const pauseTimer = () => socket?.emit("timer:pause");
  const resetTimer = () => socket?.emit("timer:reset", { to: 0 });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !socket) return;
    try {
      const token = localStorage.getItem("roomToken");
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}/room/${roomId}/files`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        }
      );
      if (!res.ok) throw new Error(await res.text());
      const meta = await res.json();
      socket.emit("file:uploaded", meta);
      setFiles((prev) => [meta, ...prev]);
    } catch (err) {
      setError("File upload failed: " + err.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const downloadFile = async (file) => {
    const token = localStorage.getItem("roomToken");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}/room/${roomId}/files/${file._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.originalName || "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError("Download error: " + e.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0b12] via-[#15131f] to-[#1b182a] text-[#f5f5f5] font-light px-6 md:px-24 pt-24 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Chat Panel */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl flex flex-col">
        <h2 className="text-xl font-orbitron text-gold-300 uppercase tracking-wide mb-2">
          Chat
        </h2>
        <div className="flex-1 overflow-y-auto space-y-2 bg-[#11172a] border border-yellow-300/20 rounded p-3">
          {chatMessages.map((m, i) => (
            <div key={i} className="text-sm font-mono">
              <div className="flex justify-between">
                <div>
                  <span className="font-semibold">{m.from}:</span> {m.text}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(m.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            ref={chatInputRef}
            type="text"
            placeholder="Type a message..."
            className="flex-1 rounded-md px-4 py-3 bg-[#11172a] border border-yellow-300/20 text-yellow-100 placeholder-slate-400 focus:ring-1 focus:ring-yellow-300 text-sm"
            onKeyDown={(e) => e.key === "Enter" && sendChat()}
          />
          <button
            onClick={sendChat}
            className="bg-gold-300 text-black font-orbitron text-sm uppercase tracking-wide px-6 py-3 rounded-md shadow hover:brightness-110 transition"
          >
            Send
          </button>
        </div>
      </div>

      {/* Notes + Timer */}
      <div className="flex flex-col gap-6">
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-orbitron text-gold-300 uppercase tracking-wide">
              Notes
            </h2>
            {lastEditor && (
              <span className="text-xs font-mono text-gold-200">
                Edited by {lastEditor}
              </span>
            )}
          </div>
          <textarea
            value={note}
            onChange={handleNoteChange}
            placeholder="Shared notes across OrbitNet..."
            className="bg-[#11172a] border border-yellow-300/20 rounded-md p-3 font-mono text-sm text-yellow-100 placeholder-slate-400 focus:ring-1 focus:ring-yellow-300 resize-none"
            rows={10}
          />
        </div>

        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl flex flex-col items-center">
          <h2 className="text-xl font-orbitron text-gold-300 uppercase tracking-wide mb-2">
            Timer
          </h2>
          <div className="text-4xl font-mono mb-4">{formatTime(timer)}</div>
          <div className="flex gap-2 w-full mb-2">
            <button
              onClick={() => startTimer(300)}
              className="flex-1 bg-gold-300 text-black font-orbitron text-sm uppercase tracking-wide px-4 py-2 rounded shadow hover:brightness-110"
            >
              Start 5m
            </button>
            <button
              onClick={pauseTimer}
              className="flex-1 bg-gold-200 text-black font-orbitron text-sm uppercase tracking-wide px-4 py-2 rounded shadow hover:brightness-110"
            >
              Pause
            </button>
            <button
              onClick={resetTimer}
              className="flex-1 bg-gold-100 text-black font-orbitron text-sm uppercase tracking-wide px-4 py-2 rounded shadow hover:brightness-110"
            >
              Reset
            </button>
          </div>
          <div className="text-xs font-mono text-gray-400">
            {timerActive ? "Running" : "Paused"}
          </div>
        </div>
      </div>

      {/* Files Panel */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl flex flex-col">
        <h2 className="text-xl font-orbitron text-gold-300 uppercase tracking-wide mb-2">
          Files
        </h2>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="mb-4 text-sm text-yellow-100"
        />
        <div className="flex-1 overflow-y-auto space-y-3">
          {files.length === 0 && (
            <div className="text-sm text-gray-400">No files uploaded yet.</div>
          )}
          {files.map((f, i) => (
            <div
              key={i}
              className="bg-[#11172a] p-3 rounded flex justify-between items-center text-sm"
            >
              <div className="flex-1">
                <div className="font-mono font-medium">{f.originalName}</div>
                <div className="text-xs text-gray-400 font-mono">
                  {f.uploader} ·{" "}
                  {new Date(f.timestamp || f.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <button
                onClick={() => downloadFile(f)}
                className="underline text-gold-200 font-mono text-sm"
              >
                Download
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 text-red-400 text-sm text-center font-mono bg-white/5 border border-red-400/30 px-6 py-3 rounded-xl shadow-xl backdrop-blur-md">
          {error}
        </div>
      )}
    </div>
  );
}
