import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, Mic, MicOff, Trash2, Clock } from "lucide-react";

const API_BASE = "http://localhost:8000";
const STORAGE_KEY = "jali_chat_history";
const SESSION_KEY = "jali_chat_session_id";
const MAX_STORED = 200; // cap stored messages

interface Msg {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number; // unix ms
}

const WELCOME: Msg = {
  id: "welcome",
  role: "assistant",
  text: "Habari! 👋 I'm Jali AI — your maternal & infant health assistant. Ask me anything about prenatal care, vaccinations, or child health in English or Swahili.",
  timestamp: Date.now(),
};

// ── Helpers ──────────────────────────────────────────────
const getOrCreateSessionId = (): string => {
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
};

const loadHistory = (): Msg[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [WELCOME];
    const parsed: Msg[] = JSON.parse(raw);
    return parsed.length > 0 ? parsed : [WELCOME];
  } catch {
    return [WELCOME];
  }
};

const saveHistory = (msgs: Msg[]) => {
  try {
    const toStore = msgs.slice(-MAX_STORED);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch { /* quota exceeded — fail silently */ }
};

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatDay = (ts: number) => {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
};

const isSameDay = (a: number, b: number) =>
  new Date(a).toDateString() === new Date(b).toDateString();

const FloatingChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(loadHistory);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [unread, setUnread] = useState(0);
  const sessionId = useRef<string>(getOrCreateSessionId());

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Persist to localStorage whenever messages change
  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const addMsg = useCallback((role: Msg["role"], text: string) => {
    const msg: Msg = { id: Date.now().toString() + Math.random(), role, text, timestamp: Date.now() };
    setMessages((p) => [...p, msg]);
    if (role === "assistant" && !isOpen) setUnread((n) => n + 1);
    return msg;
  }, [isOpen]);

  const clearHistory = () => {
    // Reset to a fresh welcome message and wipe storage
    const fresh: Msg = { ...WELCOME, id: "welcome-" + Date.now(), timestamp: Date.now() };
    setMessages([fresh]);
    setUnread(0);
    localStorage.removeItem(STORAGE_KEY);
    // New session so backend context also resets
    localStorage.removeItem(SESSION_KEY);
    sessionId.current = getOrCreateSessionId();
  };

  // ── Text send ──
  const sendText = async () => {
    const text = input.trim();
    if (!text || isSending) return;
    setInput("");
    addMsg("user", text);
    setIsSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_id: sessionId.current }),
      });
      const data = await res.json();
      addMsg("assistant", data.response || data.error || "Samahani, jaribu tena.");
    } catch {
      addMsg("assistant", "Samahani, seva haijaweza kupatikana. (Server offline)");
    }
    setIsSending(false);
  };

  // ── Voice record ──
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setIsProcessingVoice(true);
        try {
          const fd = new FormData();
          fd.append("audio", blob, "rec.webm");
          fd.append("user_id", "landing_user");
          const res = await fetch(`${API_BASE}/api/voice/chat`, { method: "POST", body: fd });
          const data = await res.json();
          addMsg("user", data.transcript || "🎤 (voice)");
          addMsg("assistant", data.response_text || "Samahani, jaribu tena.");
          if (data.response_audio) {
            const bytes = Uint8Array.from(atob(data.response_audio), (c) => c.charCodeAt(0));
            const url = URL.createObjectURL(new Blob([bytes], { type: "audio/mp3" }));
            new Audio(url).play().catch(() => {});
          }
        } catch {
          addMsg("assistant", "Sauti haikusikika vizuri. Jaribu tena. (Voice error)");
        }
        setIsProcessingVoice(false);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
    } catch {
      addMsg("assistant", "Ruhusa ya maikrofoni inakataliwa. (Mic access denied)");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* ── Chat Panel ── */}
      <div
        className="transition-all duration-300 origin-bottom-right"
        style={{
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? "scale(1) translateY(0)" : "scale(0.92) translateY(16px)",
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          style={{ width: 360, height: 520 }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-teal-600 to-emerald-500">
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-tight">Jali AI Assistant</p>
              <p className="text-white/70 text-[10px]">Maternal &amp; Infant Health · Swahili / English</p>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 1 && (
                <button
                  id="jali-chat-clear-btn"
                  onClick={clearHistory}
                  title="Clear chat history"
                  className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5 text-white/80" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-slate-50/50">
            {messages.map((m, idx) => {
              const prevMsg = messages[idx - 1];
              const showDayPill = !prevMsg || !isSameDay(prevMsg.timestamp, m.timestamp);
              return (
                <div key={m.id}>
                  {/* Day separator */}
                  {showDayPill && (
                    <div className="flex items-center gap-2 my-3">
                      <div className="flex-1 h-px bg-slate-200" />
                      <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 bg-slate-100 rounded-full flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDay(m.timestamp)}
                      </span>
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>
                  )}

                  {/* Bubble row */}
                  <div className={`flex gap-2.5 mt-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "assistant" && (
                      <div className="h-7 w-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="h-4 w-4 text-teal-600" />
                      </div>
                    )}
                    <div className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"} max-w-[82%]`}>
                      <div
                        className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          m.role === "user"
                            ? "bg-slate-800 text-white rounded-br-sm"
                            : "bg-white text-slate-700 border border-slate-100 shadow-sm rounded-bl-sm"
                        }`}
                      >
                        {m.text}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 px-1 flex items-center gap-1">
                        {formatTime(m.timestamp)}
                      </span>
                    </div>
                    {m.role === "user" && (
                      <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="h-4 w-4 text-slate-500" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {(isSending || isProcessingVoice) && (
              <div className="flex gap-2.5 justify-start">
                <div className="h-7 w-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-4 w-4 text-teal-600" />
                </div>
                <div className="bg-white border border-slate-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Recording banner */}
          {isRecording && (
            <div className="bg-red-50 border-t border-red-100 px-4 py-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-600 font-medium">Listening... tap mic to stop</span>
            </div>
          )}

          {/* Input bar */}
          <div className="border-t border-slate-100 bg-white px-3 py-3">
            <div className="flex items-center gap-2">
              <button
                id="jali-chat-mic-btn"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessingVoice || isSending}
                className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  isRecording
                    ? "bg-red-500 text-white scale-110 shadow-lg"
                    : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                } disabled:opacity-40`}
              >
                {isProcessingVoice
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : isRecording
                  ? <MicOff className="h-4 w-4" />
                  : <Mic className="h-4 w-4" />}
              </button>

              <input
                ref={inputRef}
                id="jali-chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRecording ? "Recording..." : "Type in English or Swahili..."}
                disabled={isRecording || isSending || isProcessingVoice}
                className="flex-1 h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/20 disabled:opacity-50 transition-colors"
              />

              <button
                id="jali-chat-send-btn"
                onClick={sendText}
                disabled={!input.trim() || isSending || isRecording}
                className="h-9 w-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 hover:bg-teal-500 disabled:opacity-30 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-center text-[9px] text-slate-300 mt-2 tracking-wide">
              Jali AI may make mistakes — always consult a health professional.
            </p>
          </div>
        </div>
      </div>

      {/* ── FAB Button ── */}
      <button
        id="jali-chat-fab"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Open Jali AI Chat"
        className={`relative w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
          isOpen
            ? "bg-slate-700 hover:bg-slate-600"
            : "bg-gradient-to-br from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400"
        }`}
      >
        {/* Unread badge */}
        {!isOpen && unread > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center z-10">
            {unread}
          </span>
        )}

        {/* Icon */}
        <div className="relative h-6 w-6">
          <MessageCircle
            className={`absolute inset-0 transition-all duration-300 text-white ${
              isOpen ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
            }`}
          />
          <X
            className={`absolute inset-0 transition-all duration-300 text-white ${
              isOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
            }`}
          />
        </div>

        {/* Pulse ring when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-teal-400/30 animate-ping pointer-events-none" />
        )}
      </button>
    </div>
  );
};

export default FloatingChatButton;
