import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

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
  const mergeChatMessages = (history) => {
    setChatMessages((prev) => {
      const existing = new Set(
        prev.map((m) => `${m.from}-${m.timestamp}-${m.text}`)
      );
      const combined = [
        ...history.filter(
          (m) => !existing.has(`${m.from}-${m.timestamp}-${m.text}`)
        ),
        ...prev,
      ];
      // sort chronologically if needed
      combined.sort((a, b) => a.timestamp - b.timestamp);
      return combined;
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
      } catch (e) {
        // ignore
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
        if (res.ok) {
          setFiles(await res.json());
        }
      } catch (e) {
        // ignore
      }
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
    s.on("file:deleted", ({ _id }) => {
      setFiles((prev) => prev.filter((f) => f._id !== _id));
    });

    setSocket(s);
    return () => {
      if (noteTimeout.current) clearTimeout(noteTimeout.current);
      s.disconnect();
    };
  }, [roomId, navigate]);

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
    setUploadProgress(0);
    try {
      const token = localStorage.getItem("roomToken");
      if (!token) throw new Error("Missing auth token.");

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(
          "POST",
          `${import.meta.env.VITE_API_BASE}/room/${roomId}/files`
        );
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(
              Math.round((event.loaded / event.total) * 100)
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const meta = JSON.parse(xhr.responseText);
              socket?.emit("file:uploaded", meta);
              setFiles((prev) => [meta, ...prev]);
              resolve();
            } catch (err) {
              reject(new Error("Invalid JSON from server"));
            }
          } else {
            reject(new Error(xhr.responseText || `Upload failed ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during upload."));
        const form = new FormData();
        form.append("file", file);
        xhr.send(form);
      });
    } catch (err) {
      setError("File upload failed: " + err.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
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

  const handleDeleteFile = async (file) => {
    if (!window.confirm(`Delete "${file.originalName}"? This cannot be undone.`))
      return;
    const token = localStorage.getItem("roomToken");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}/room/${roomId}/files/${file._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Delete failed");
      }
      setFiles((prev) => prev.filter((f) => f._id !== file._id));
    } catch (e) {
      setError("Delete error: " + e.message);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#0a0b12] via-[#15131f] to-[#1b182a] text-[#f5f5f5] font-light px-6 md:px-24 pt-24 pb-16">
      {/* Ambient SVG Layer */}
      <div className="absolute inset-0 pointer-events-none opacity-30 blur-sm z-0">
        <img
          src="/ambient-bg.svg"
          alt="ambient"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Panel */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl flex flex-col">
          <h2 className="text-xl font-orbitron text-gold-300 uppercase tracking-wide mb-2">
            Chat
          </h2>
          <div className="flex-1 overflow-y-auto space-y-2 bg-[#11172a] border border-yellow-300/20 rounded p-3">
            {chatMessages.map((m, i) => (
              <div key={i} className="text-sm font-mono">
                <div className="flex justify-between">
                  <span>
                    <span className="font-semibold">{m.from}:</span> {m.text}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(m.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
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

        {/* Notes & Timer */}
        <div className="flex flex-col gap-6">
          {/* Notes */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-orbitron text-gold-300 uppercase">
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
              className="bg-[#11172a] border border-yellow-300/20 rounded-md p-3 font-mono text-sm text-yellow-100 placeholder-slate-400 focus:ring-1 focus:ring-yellow-300 resize-none w-full"
              rows={10}
            />
          </div>

          {/* Timer */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl flex flex-col items-center">
            <h2 className="text-xl font-orbitron text-gold-300 uppercase tracking-wide mb-2">
              Timer
            </h2>
            <div className="text-4xl font-mono mb-4">{formatTime(timer)}</div>
            <div className="flex gap-2 w-full mb-2">
              <input
                type="number"
                min="0"
                value={customMinutes}
                onChange={(e) =>
                  setCustomMinutes(e.target.value.replace(/\D/, ""))
                }
                className="w-16 bg-[#0d1025] border border-yellow-300/20 rounded px-2 py-1 text-sm text-yellow-100"
                placeholder="Min"
              />
              <span className="font-mono text-yellow-100">:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={customSeconds}
                onChange={(e) => {
                  let v = e.target.value.replace(/\D/, "");
                  if (parseInt(v || "0", 10) > 59) v = "59";
                  setCustomSeconds(v);
                }}
                className="w-16 bg-[#0d1025] border border-yellow-300/20 rounded px-2 py-1 text-sm text-yellow-100"
                placeholder="Sec"
              />
              <button
                onClick={() => {
                  const dur = parseCustomDuration();
                  if (dur !== null) startTimer(dur);
                  else setError("Invalid timer input.");
                }}
                className="flex-1 bg-gold-300 text-black font-orbitron text-sm uppercase tracking-wide px-4 py-2 rounded shadow hover:brightness-110 transition"
              >
                Start
              </button>
              <button
                onClick={pauseTimer}
                className="bg-gold-200 text-black font-orbitron text-sm uppercase tracking-wide px-4 py-2 rounded shadow hover:brightness-110 transition"
              >
                Pause
              </button>
              <button
                onClick={resetTimer}
                className="bg-gold-100 text-black font-orbitron text-sm uppercase tracking-wide px-4 py-2 rounded shadow hover:brightness-110 transition"
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

          <div className="mb-4">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                className="flex-1 text-sm rounded-md bg-[#11172a] border border-yellow-300/20 px-3 py-2 text-yellow-100"
              />
              {uploading && (
                <div className="text-xs font-mono">
                  Uploading... {uploadProgress}%
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {files.length === 0 && (
              <div className="text-sm text-gray-400">
                No files uploaded yet.
              </div>
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
                    {new Date(f.timestamp || f.createdAt).toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => downloadFile(f)}
                    className="underline text-gold-200 font-mono text-sm hover:text-gold-100 transition"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleDeleteFile(f)}
                    className="underline text-red-400 font-mono text-sm hover:text-red-300 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 text-red-400 text-sm text-center font-mono bg-white/5 border border-red-400/30 px-6 py-3 rounded-xl shadow-xl backdrop-blur-md">
          {error}
        </div>
      )}
    </div>
  );
}
