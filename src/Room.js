import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import { Toaster, toast } from "react-hot-toast";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// ================= SOCKET =================
const socket = io("https://finalnodejscodeshare.onrender.com/");

// ================= COPY BUTTON =================
const CopyButton = ({ text, className = "" }) => {
  const [copied, setCopied] = useState(false);

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <button
      onClick={doCopy}
      className={`rounded-md p-2 bg-gray-800 hover:bg-gray-700 text-white ${className}`}
    >
      {copied ? "✅" : "📋"}
    </button>
  );
};

// ================= DOWNLOAD BUTTON =================
const DownloadButtonWithExpire = ({ fileName, fileData, uploadedAt, removed }) => {
  const [timeLeft, setTimeLeft] = useState(30 * 60);

  useEffect(() => {
    if (!uploadedAt) return;
    const elapsed = Math.floor((Date.now() - uploadedAt) / 1000);
    setTimeLeft(Math.max(30 * 60 - elapsed, 0));

    const timer = setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [uploadedAt]);

  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleDownload = async () => {
    if (removed) {
      toast.error(`⚠️ "${fileName}" was removed from the server.`);
      return;
    }
    try {
      const head = await fetch(fileData, { method: "HEAD" });
      if (!head.ok) throw new Error("File not found");

      const link = document.createElement("a");
      link.href = fileData;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`✅ "${fileName}" download started.`);
    } catch {
      toast.error(`⚠️ "${fileName}" is no longer available on the server.`);
    }
  };

  return (
    <div className="flex items-center space-x-2 justify-end">
      <span className="text-sm font-mono text-red-500 animate-blink">
        {formatTime(timeLeft)}
      </span>
      {!removed ? (
        <button
          onClick={handleDownload}
          className="rounded-md p-2 bg-blue-700 hover:bg-blue-600 text-white"
        >
          ⬇️
        </button>
      ) : (
        <span className="text-red-400 font-semibold">⚠️ Removed from server</span>
      )}
    </div>
  );
};

// Blinking CSS
const styles = `
@keyframes blink { 0%,50%,100%{opacity:1} 25%,75%{opacity:0} }
.animate-blink { animation: blink 1s step-start infinite; }
`;
const InjectStyles = () => {
  useEffect(() => {
    const tag = document.createElement("style");
    tag.innerHTML = styles;
    document.head.appendChild(tag);
    return () => tag.remove();
  }, []);
  return null;
};
const LargeCodeBlock = ({ code }) => {
  const [expanded, setExpanded] = useState(false);
  const lineCount = code.split("\n").length;
  const isLarge = lineCount > 200;

  const displayCode = expanded
    ? code
    : code.split("\n").slice(0, 200).join("\n") +
    (isLarge ? "\n\n... (truncated, click expand to see full)" : "");

  return (
    <div className="relative">
      <SyntaxHighlighter
        language="javascript"
        style={oneDark}
        wrapLongLines
        className="rounded-lg text-base"
      >
        {displayCode}
      </SyntaxHighlighter>

      {isLarge && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded text-sm"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      )}
    </div>
  );
};

// ================= ROOM =================
const Room = () => {
  const { roomId } = useParams();
  const [contentType, setContentType] = useState("text");
  const [textContent, setTextContent] = useState("");
  const [messages, setMessages] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);

  // === SOCKET SETUP ===
  useEffect(() => {
    socket.emit("join-room", roomId);

    socket.on("room-messages", (msgs) => {
      const trimmed = msgs.slice(-50); // keep only last 50
      setMessages(trimmed);
      localStorage.setItem("latestMessages_" + roomId, JSON.stringify(trimmed));
    });


    socket.on("room-message", (msg) => {
      if (msg.type === "text") {
        setTextContent(msg.content); // 🟢 live shared typing
      } else {
        setMessages((prev) => {
          const updated = [...prev, msg];
          localStorage.setItem("latestMessages_" + roomId, JSON.stringify(updated));
          return updated;
        });
      }
    });

    // ✅ fix: handle file removal by fileName
    socket.on("file-removed", ({ fileName }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.type === "file" && msg.fileName === fileName
            ? { ...msg, removed: true, data: null }
            : msg
        )
      );
      toast.error(`⚠️ "${fileName}" was removed from the server.`);
    });

    socket.on("room-contentType", (t) => setContentType(t));

    const saved = localStorage.getItem("latestMessages_" + roomId);
    if (saved) setMessages(JSON.parse(saved));

    return () => {
      socket.off("room-messages");
      socket.off("room-message");
      socket.off("file-removed");
      socket.off("room-contentType");
    };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // === TEXT CHANGE ===
  const handleTextChange = useCallback(
    (e) => {
      const value = e.target.value;
      setTextContent(value);

      // 🟢 broadcast current typing to all in the room
      socket.emit("room-message", {
        roomId,
        type: "text",
        content: value,
      });
    },
    [roomId]
  );

  // === FILE UPLOAD ===
  const handleFileUpload = async (e) => {
    for (const file of Array.from(e.target.files || [])) {
      await uploadFileWithMultipart(file);
    }
  };

  const uploadFileWithMultipart = async (file) => {
    const CHUNK_SIZE = 5 * 1024 * 1024;
    const BATCH_SIZE = 50;
    const MAX_RETRIES = 3;

    try {
      let uploadedBytes = 0;
      const uploadedParts = [];
      setUploadProgress({ fileName: file.name, percent: 0 });

      socket.emit("initiate-multipart", { roomId, fileName: file.name, fileType: file.type });

      socket.once("multipart-initiated", async ({ uploadId }) => {
        const totalParts = Math.ceil(file.size / CHUNK_SIZE);

        for (let i = 0; i < totalParts; i += BATCH_SIZE) {
          const batch = Array.from(
            { length: Math.min(BATCH_SIZE, totalParts - i) },
            (_, idx) => i + idx + 1
          );

          socket.emit("get-presigned-urls", { uploadId, partNumbers: batch });
          const urls = await new Promise((res) =>
            socket.once("presigned-urls", (d) => res(d.urls))
          );

          await Promise.all(
            urls.map(({ partNumber, url }) =>
              uploadPart(file, partNumber, url, uploadedParts, MAX_RETRIES, (bytes) => {
                uploadedBytes += bytes;
                setUploadProgress({
                  fileName: file.name,
                  percent: Math.round((uploadedBytes / file.size) * 100),
                });
              })
            )
          );
        }

        uploadedParts.sort((a, b) => a.PartNumber - b.PartNumber);
        socket.emit("complete-multipart", { uploadId, parts: uploadedParts });

        socket.once("complete-success", ({ location }) => {
          toast.success(`✅ Uploaded ${file.name}`);
          socket.emit("room-message", {
            roomId,
            type: "file",
            fileName: file.name,
            fileType: file.type,
            data: location,
            uploadedAt: Date.now(),
          });
          setUploadProgress(null);
        });

        socket.once("complete-error", ({ message }) => {
          throw new Error(message);
        });
      });

      socket.once("multipart-error", ({ message }) => {
        throw new Error(message);
      });
    } catch (err) {
      toast.error(`Upload failed: ${err.message}`);
      setUploadProgress(null);
    }
  };

  // === UPLOAD PART ===
  const uploadPart = async (file, partNumber, url, uploadedParts, retries, onProgress) => {
    const start = (partNumber - 1) * (5 * 1024 * 1024);
    const end = Math.min(start + 5 * 1024 * 1024, file.size);
    const blob = file.slice(start, end);

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, { method: "PUT", body: blob });
        if (!res.ok) throw new Error(`Part ${partNumber} failed`);
        const eTag = res.headers.get("ETag")?.replace(/"/g, "");
        uploadedParts.push({ PartNumber: partNumber, ETag: eTag });
        onProgress(blob.size);
        return;
      } catch (err) {
        if (attempt === retries) throw err;
        console.warn(`Retrying part ${partNumber}, attempt ${attempt + 1}`);
      }
    }
  };

  // === CONTENT TYPE CHANGE ===
  const handleContentTypeChange = (e) => {
    const newType = e.target.value;
    setContentType(newType);
    setTextContent("");
    socket.emit("room-contentType", { roomId, type: newType });
  };

  // === RENDER ===
  return (
    <div className="relative min-h-screen bg-gray-900 text-white">
      <Toaster position="top-right" />
      <InjectStyles />

      {/* Sidebar toggle */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className="fixed top-4 left-4 z-[60] p-2 rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-lg"
        title={sidebarOpen ? "Hide last 5" : "Show last 5"}
      >
        {sidebarOpen ? "⬅" : "☰"}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-gray-800 border-r border-gray-700 z-50 transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="p-4 mt-14">
          <h3 className="text-lg font-bold mb-4">📌 Last 5 Messages</h3>
          <div className="space-y-3 overflow-y-auto max-h-[80vh] pr-1">
            {messages.slice(-5).map((msg, i) => (
              <div
                key={i}
                className="bg-gray-700 p-3 rounded-lg shadow-md flex justify-between items-center"
              >
                <div className="truncate text-sm pr-4">
                  {msg.type === "text" ? msg.content : `📁 ${msg.fileName}`}
                </div>
                {msg.type === "text" ? (
                  <CopyButton text={msg.content} />
                ) : (
                  <DownloadButtonWithExpire
                    fileName={msg.fileName}
                    fileData={msg.data}
                    uploadedAt={msg.uploadedAt}
                    removed={msg.removed}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="fixed top-3 left-16 right-4 z-[55] bg-indigo-700 text-white rounded-lg shadow-lg overflow-hidden h-10 flex items-center">
        <div className="animate-marquee whitespace-nowrap">
          <span className="mx-6">
            ✨ Your last 5 shared items (Text • Images • PDFs • Documents) are safely stored in the left panel.
            Use the 📥 Download button to access and save them! ✨
          </span>
        </div>
      </div>
      <style>
        {`@keyframes marquee{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}} .animate-marquee{display:inline-block;animation:marquee 40s linear infinite}`}
      </style>

      {/* Main */}
      <div className="flex justify-center items-start w-full min-h-screen px-4 pt-16">
        <div className="bg-gray-800 shadow-2xl rounded-2xl w-full h-[92vh] p-4 overflow-hidden">
          <div className="flex flex-col h-full">
            <h2 className="text-2xl font-bold text-center mb-4">
              Codeshare ID<span className="text-indigo-400">-{roomId}</span>
            </h2>

            {/* Type select */}
            <div className="flex justify-center pb-4">
              <select
                value={contentType}
                onChange={handleContentTypeChange}
                className="bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2"
              >
                <option value="text">✍️ Text / Code</option>
                <option value="image">🖼️ Image (PNG, JPG, SVG)</option>
                <option value="pdf">📕 PDF</option>
                <option value="document">📘 Document (Word, Excel, PPT, etc.)</option>
                <option value="audio">🎵 Audio</option>
                <option value="video">🎥 Video</option>
                <option value="archive">🧩 Compressed (ZIP, RAR, 7z, TAR)</option>
                <option value="other">📦 Other File Types</option>
              </select>

            </div>

            {/* Text or Upload */}
            {contentType === "text" ? (
              <div className="relative w-full h-[70vh]">
                {/* 🆕 Copy button at top-right of textarea */}
                <div className="absolute right-4 top-2 z-10">
                  <CopyButton text={textContent} />
                </div>
                <textarea
                  className="w-full h-full bg-gray-900 border border-gray-700 rounded-lg p-4 text-lg text-white resize-none"
                  placeholder="Start typing..."
                  value={textContent}
                  onChange={handleTextChange}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center mb-6">
                <label className="cursor-pointer bg-indigo-600 text-white px-6 py-2 rounded-lg">
                  Upload {contentType.toUpperCase()}
                  <input
                    type="file"
                    multiple
                    accept={
                      contentType === "image"
                        ? "image/*"
                        : contentType === "pdf"
                          ? "application/pdf"
                          : contentType === "document"
                            ? ".doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                            : contentType === "audio"
                              ? "audio/*"
                              : contentType === "video"
                                ? "video/*"
                                : contentType === "archive"
                                  ? ".zip,.rar,.7z,.tar,.gz"
                                  : "*/*" // ✅ for "other" type, allow everything
                    }
                    onChange={(e) => {
                      handleFileUpload(e);
                      e.target.value = ""; // ✅ allows re-uploading same file
                    }}
                    className="hidden"
                  />

                </label>
                {uploadProgress && (
                  <div className="w-64 bg-gray-700 mt-4 rounded-lg overflow-hidden shadow-inner">
                    <div
                      className="bg-indigo-500 h-3 transition-all duration-200"
                      style={{ width: `${uploadProgress.percent}%` }}
                    />
                    <p className="text-sm text-gray-300 mt-2 text-center">
                      Uploading {uploadProgress.fileName} — {uploadProgress.percent}%
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Preview latest */}
            {contentType !== "text" && (
              <div className="flex-1 overflow-y-auto pr-1">
                {messages.length > 0 &&
                  messages[messages.length - 1].type === "file" && (
                    <div className="relative bg-gray-700 rounded-xl shadow-md p-4">
                      <div className="absolute top-2 right-2 z-10">
                        <DownloadButtonWithExpire
                          fileName={messages[messages.length - 1].fileName}
                          fileData={messages[messages.length - 1].data}
                          uploadedAt={messages[messages.length - 1].uploadedAt}
                          removed={messages[messages.length - 1].removed}
                        />
                      </div>

                      <div className="overflow-y-auto rounded-b-xl max-h-[80vh] mt-10">
                        {/* Image preview */}
                        {messages[messages.length - 1].type === "file" &&
                          messages[messages.length - 1].fileType?.startsWith("image/") && (
                            <img
                              src={messages[messages.length - 1].data}
                              alt={messages[messages.length - 1].fileName}
                              className="max-h-[70vh] mx-auto rounded-lg shadow-lg border"
                            />
                          )}

                        {/* PDF preview */}
                        {messages[messages.length - 1].type === "file" &&
                          messages[messages.length - 1].fileType === "application/pdf" && (
                            <embed
                              src={messages[messages.length - 1].data}
                              type="application/pdf"
                              className="w-full h-[70vh] border rounded-lg shadow-lg"
                            />
                          )}

                        {/* Other file types */}
                        {messages[messages.length - 1].type === "file" &&
                          !messages[messages.length - 1].fileType?.startsWith("image/") &&
                          messages[messages.length - 1].fileType !== "application/pdf" && (
                            <p className="text-gray-300">
                              📑 {messages[messages.length - 1].fileName}
                            </p>
                          )}
                      </div>
                    </div>
                  )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;
