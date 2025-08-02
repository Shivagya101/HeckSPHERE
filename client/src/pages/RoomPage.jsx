import { useEffect, useState, useRef, useCallback, useContext } from "react";
import { Link, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import RepoCommits from "../components/RepoCommits";
const formatTime = (sec) => {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

export default function RoomPage() {
  const { roomId } = useParams();
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Optional: show a "Copied!" message
      alert("Room ID copied to clipboard!");
    });
  };
  const { api, token } = useAuth();
  const [socket, setSocket] = useState(null);

  // Notes
  const [note, setNote] = useState("");
  const [lastEditor, setLastEditor] = useState(null);
  const noteTimeout = useRef(null);

  // Chat
  const [chatMessages, setChatMessages] = useState([]);
  const chatInputRef = useRef();
  const initialChatLoaded = useRef(false);

  // Timer
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("5");
  const [customSeconds, setCustomSeconds] = useState("00");

  // Files
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Error
  const [error, setError] = useState("");

  // Merge incoming chat history (avoid duplicates)
  // ensure every message has a timestamp (fall back to createdAt if missing)
  const normalizeMsg = (m) => ({
    ...m,
    timestamp:
      m.timestamp ??
      (m.createdAt ? new Date(m.createdAt).getTime() : Date.now()),
  });

  const mergeChatMessages = (history) => {
    setChatMessages((prev) => {
      const existing = new Set(
        prev.map((m) => `${m.from}-${m.timestamp}-${m.text}`)
      );
      const normalizedHistory = history.map(normalizeMsg);
      const combined = [
        ...normalizedHistory.filter(
          (m) => !existing.has(`${m.from}-${m.timestamp}-${m.text}`)
        ),
        ...prev,
      ];
      combined.sort((a, b) => a.timestamp - b.timestamp);
      return combined;
    });
  };

  useEffect(() => {
    // Inside RoomPage.jsx...

    const fetchChatHistory = async () => {
      try {
        // Add /api/ before room/
        const { data } = await api.get(`/api/rooms/${roomId}/chat`);
        mergeChatMessages(data);
      } catch (e) {
        console.error("Failed to fetch chat history", e);
      }
    };

    const fetchFiles = async () => {
      try {
        // Add /api/ before room/
        const { data } = await api.get(`/api/rooms/${roomId}/files`);
        setFiles(data);
      } catch (e) {
        console.error("Failed to fetch files", e);
      }
    };

    fetchChatHistory();
    fetchFiles();

    const s = io(import.meta.env.VITE_API_BASE_URL, {
      auth: {
        token: token, // Pass the JWT for authentication
      },
      query: {
        roomId,
      },
    });

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
    s.on("file:deleted", ({ _id }) => {
      setFiles((prev) => prev.filter((f) => f._id !== _id));
    });

    setSocket(s);
    return () => {
      if (noteTimeout.current) clearTimeout(noteTimeout.current);
      s.disconnect();
    };
  }, [roomId, api, token]);

  const emitNote = useCallback(
    (value) => socket?.emit("notes:update", value),
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

  const startTimer = (seconds) =>
    socket?.emit("timer:start", { duration: seconds });
  const pauseTimer = () => socket?.emit("timer:pause");
  const resetTimer = () => socket?.emit("timer:reset", { to: 0 });

  const parseCustomDuration = () => {
    const m = parseInt(customMinutes, 10);
    const s = parseInt(customSeconds, 10);
    if (isNaN(m) || isNaN(s) || m < 0 || s < 0 || s > 59) return null;
    return m * 60 + s;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);

    const form = new FormData();
    form.append("file", file);

    try {
      const { data } = await api.post(`/api/rooms/${roomId}/files`, form, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });
      // The backend controller no longer emits the socket event, so we handle it here.
      socket?.emit("file:uploaded", data);
      setFiles((prev) => [data, ...prev]);
    } catch (err) {
      setError(
        "File upload failed: " + (err.response?.data?.error || err.message)
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // REWRITTEN: downloadFile to use the API client
  const downloadFile = async (file) => {
    try {
      const response = await api.get(`/api/rooms/${roomId}/files/${file._id}`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      setError("Download error: " + e.message);
    }
  };

  // REWRITTEN: handleDeleteFile to use the API client
  const handleDeleteFile = async (file) => {
    if (
      !window.confirm(`Delete "${file.originalName}"? This cannot be undone.`)
    )
      return;
    try {
      await api.delete(`/api/rooms/${roomId}/files/${file._id}`);
      setFiles((prev) => prev.filter((f) => f._id !== file._id));
    } catch (e) {
      setError("Delete error: " + e.message);
    }
  };
  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 text-white font-light bg-gradient-to-br from-[#1f1c2c] to-[#11172a]">
      {/* --- HEADER --- */}
      <header className="max-w-screen-2xl mx-auto mb-8 flex justify-between items-center">
        <div className="border border-white/10 rounded-xl bg-white/5 backdrop-blur-md shadow-lg p-3">
          <span className="text-xs text-primary/80 font-mono">ROOM ID</span>
          <div className="flex items-center gap-4">
            <span className="text-lg font-orbitron text-primary tracking-widest">
              {roomId}
            </span>
            <button
              onClick={() => copyToClipboard(roomId)}
              className="px-4 py-1 font-semibold text-xs bg-white text-black border border-primary rounded-md tracking-wider uppercase transition-colors duration-200 hover:bg-primary hover:text-black"
            >
              Copy
            </button>
          </div>
        </div>
        <a
          href="/dashboard"
          className="px-5 py-2 font-orbitron text-xs font-semibold text-slate-300 uppercase tracking-wider bg-white/5 border border-white/10 rounded-lg transition-colors hover:bg-white/10 hover:text-white"
        >
          Dashboard
        </a>
      </header>
      {/* --- MAIN GRID --- */}
      <main className="max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- CHAT PANEL --- */}
        <div className="border border-white/10 rounded-2xl bg-white/5 backdrop-blur-md shadow-lg p-6 flex flex-col h-[85vh]">
          <h2 className="text-2xl font-orbitron text-primary tracking-widest mb-4">
            Chat ⌁
          </h2>
          <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-black/20 rounded-lg">
            {chatMessages.map((m, i) => (
              <div key={i} className="text-sm break-words">
                <span className="font-semibold text-primary/90">{m.from}:</span>
                <span className="text-slate-300 ml-2">{m.text}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-3">
            <input
              ref={chatInputRef}
              type="text"
              placeholder="Transmit message..."
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              className="flex-1 bg-transparent border-b border-primary/20 placeholder-slate-400 px-2 py-2 outline-none focus:border-primary transition"
            />
            <button
              onClick={sendChat}
              className="px-6 py-2 font-semibold text-sm bg-primary/80 hover:bg-primary text-black rounded-lg tracking-wider uppercase transition-all"
            >
              Send
            </button>
          </div>
        </div>
        {/* --- MIDDLE COLUMN --- */}
        <div className="flex flex-col gap-6">
          {/* --- NOTES PANEL --- */}
          <div className="border border-white/10 rounded-2xl bg-white/5 backdrop-blur-md shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-orbitron text-primary tracking-widest">
                Notes ⌁
              </h2>
              {lastEditor && (
                <span className="text-xs font-mono text-primary/70">
                  Edited by {lastEditor}
                </span>
              )}
            </div>
            <textarea
              value={note}
              onChange={handleNoteChange}
              placeholder="Shared mission logs..."
              className="w-full h-48 bg-transparent border border-primary/20 rounded-lg p-3 text-slate-200 placeholder-slate-400 outline-none focus:border-primary transition resize-none"
            />
          </div>
          {/* --- TIMER PANEL --- */}
          <div className="border border-white/10 rounded-2xl bg-white/5 backdrop-blur-md shadow-lg p-6 flex flex-col items-center">
            <h2 className="text-2xl font-orbitron text-primary tracking-widest mb-4">
              Timer ⌁
            </h2>
            <div className="text-6xl font-mono mb-6">{formatTime(timer)}</div>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="0"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                className="w-20 bg-transparent border-b border-primary/20 text-center text-lg p-2 outline-none focus:border-primary transition"
              />
              <span className="text-3xl font-mono text-primary/50">:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={customSeconds}
                onChange={(e) => setCustomSeconds(e.target.value)}
                className="w-20 bg-transparent border-b border-primary/20 text-center text-lg p-2 outline-none focus:border-primary transition"
              />
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => startTimer(parseCustomDuration())}
                className="px-6 py-2 font-semibold text-sm bg-primary/80 hover:bg-primary text-black rounded-lg tracking-wider uppercase transition-all"
              >
                Start
              </button>
              <button
                onClick={resetTimer}
                className="px-6 py-2 font-semibold text-sm bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg tracking-wider uppercase transition-all"
              >
                Reset
              </button>
            </div>
            <div className="text-xs font-mono text-slate-400 mt-4">
              {timerActive ? "STATUS: RUNNING" : "STATUS: IDLE"}
            </div>
          </div>
        </div>
        {/* --- RIGHT COLUMN --- */}
        <div className="flex flex-col gap-6">
          <RepoCommits roomId={roomId} />
          {/* --- REDESIGNED FILES PANEL --- */}
          <div className="border border-white/10 rounded-2xl bg-white/5 backdrop-blur-md shadow-lg p-6 flex flex-col flex-1">
            <h2 className="text-2xl font-orbitron text-primary tracking-widest mb-4">
              Files ⌁
            </h2>
            {/* Custom styled file input */}
            <label className="w-full text-center mb-4 px-6 py-3 font-semibold text-sm bg-primary/80 hover:bg-primary text-black rounded-lg tracking-wider uppercase transition-all cursor-pointer">
              {uploading ? `Uploading... ${uploadProgress}%` : "Upload File"}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {files.length === 0 && (
                <div className="text-center text-slate-400 text-sm p-4">
                  No files uploaded yet.
                </div>
              )}
              {files.map((f) => (
                <div
                  key={f._id}
                  className="flex items-center justify-between bg-black/20 p-3 rounded-lg"
                >
                  <div className="truncate pr-4">
                    <p className="text-sm text-slate-200">{f.originalName}</p>
                    <p className="text-xs text-slate-500 font-mono">
                      Uploaded by {f.uploader}
                    </p>
                  </div>
                  <button
                    onClick={() => downloadFile(f)}
                    className="text-xs font-semibold text-primary hover:underline whitespace-nowrap"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      {/* Error Alert */}
      {error && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 text-red-400 text-sm text-center font-mono bg-white/5 border border-red-400/30 px-6 py-3 rounded-xl shadow-xl backdrop-blur-md">
          {error}
        </div>
      )}
    </div>
  );
}
