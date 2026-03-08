import { useState, useEffect, useRef } from "react";
import {
  Users, FolderOpen, MapPin, Clock, ChevronRight,
  Send, Mic, MicOff, Square, Loader2, Volume2,
  Activity, CheckCircle2, AlertTriangle, Circle,
  CalendarDays,
} from "lucide-react";
import { useRealtime } from "@/hooks/useRealtime";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import jaliLogo from "@/assets/jali-logo.svg";

const API_BASE = "http://localhost:8000";

// ── Agents ──────────────────────────────────────────────
const agents = [
  { id: "hiv", name: "HIV Adherence", status: "active", lastRun: "2h ago", accuracy: "94.2%", records: "1,247" },
  { id: "tb", name: "TB Treatment", status: "active", lastRun: "3h ago", accuracy: "91.8%", records: "863" },
  { id: "imm", name: "Immunization", status: "idle", lastRun: "6h ago", accuracy: "96.1%", records: "2,104" },
  { id: "fp", name: "Family Planning", status: "active", lastRun: "1h ago", accuracy: "89.5%", records: "956" },
];

const statusIcon = {
  active: <Circle className="h-2 w-2 fill-green-500 text-green-500" />,
  idle: <Circle className="h-2 w-2 fill-slate-300 text-slate-300" />,
  error: <AlertTriangle className="h-3 w-3 text-red-500" />,
};

// ── Cases ───────────────────────────────────────────────
const cases = [
  { name: "Grace Wanjiku", initials: "GW", type: "Prenatal Care", location: "Kibera", urgency: "high" as const, lastVisit: "2d ago", progress: 35 },
  { name: "Samuel Oduor", initials: "SO", type: "Growth Monitoring", location: "Mathare", urgency: "medium" as const, lastVisit: "5d ago", progress: 68 },
  { name: "Fatuma Ali", initials: "FA", type: "Immunization", location: "Eastleigh", urgency: "low" as const, lastVisit: "1w ago", progress: 90 },
];

const urgencyLabel: Record<string, { text: string; cls: string }> = {
  high: { text: "Urgent", cls: "text-red-600 bg-red-50" },
  medium: { text: "Medium", cls: "text-amber-600 bg-amber-50" },
  low: { text: "Routine", cls: "text-green-600 bg-green-50" },
};

// ── Chat Types ──────────────────────────────────────────
interface Msg { role: "user" | "assistant"; text: string; audio?: string; }

// ═════════════════════════════════════════════════════════
const Dashboard = () => {
  const { events, isConnected } = useRealtime();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Chat
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/stats`);
        setStats(await res.json());
      } catch { /* offline */ } finally { setIsLoading(false); }
    };
    fetchStats();
    const iv = setInterval(fetchStats, 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ── Text chat ──
  const sendText = async () => {
    const text = chatInput.trim();
    if (!text || isSending) return;
    setChatInput("");
    setMessages(p => [...p, { role: "user", text }]);
    setIsSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_id: "dashboard" }),
      });
      const data = await res.json();
      setMessages(p => [...p, { role: "assistant", text: data.response || data.error || "No response" }]);
    } catch {
      setMessages(p => [...p, { role: "assistant", text: "Server offline. Try again later." }]);
    }
    setIsSending(false);
  };

  // ── Voice record ──
  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setIsProcessingVoice(true);
        try {
          const fd = new FormData();
          fd.append("audio", blob, "rec.webm");
          fd.append("user_id", "dashboard");
          const res = await fetch(`${API_BASE}/api/voice/chat`, { method: "POST", body: fd });
          const data = await res.json();
          setMessages(p => [...p, { role: "user", text: data.transcript }]);
          setMessages(p => [...p, { role: "assistant", text: data.response_text, audio: data.response_audio }]);
          if (data.response_audio) {
            const bytes = Uint8Array.from(atob(data.response_audio), c => c.charCodeAt(0));
            const url = URL.createObjectURL(new Blob([bytes], { type: "audio/mp3" }));
            new Audio(url).play().catch(() => { });
          }
        } catch { setMessages(p => [...p, { role: "assistant", text: "Voice processing failed." }]); }
        setIsProcessingVoice(false);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
    } catch { /* mic denied */ }
  };
  const stopRec = () => { mediaRecorderRef.current?.stop(); setIsRecording(false); };

  const playB64 = (b64: string) => {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    new Audio(URL.createObjectURL(new Blob([bytes], { type: "audio/mp3" }))).play().catch(() => { });
  };

  const val = (k: string, fb: string) => isLoading ? "—" : stats?.[k]?.value || fb;

  return (
    <div className="max-w-[1200px] mx-auto animate-in fade-in duration-300">

      {/* ── HEADER ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-sm text-slate-400 mb-1">{new Date().toLocaleDateString("en-KE", { weekday: "long", month: "long", day: "numeric" })}</p>
          <h1 className="text-2xl font-medium text-slate-900">
            {greeting}, <span className="font-semibold">Amara</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${isConnected ? "text-green-700 bg-green-50" : "text-slate-400 bg-slate-50"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-green-500" : "bg-slate-300"}`} />
            {isConnected ? "Live" : "Offline"}
          </span>
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Active Cases", value: val("activeCases", "24"), sub: "+3 this week" },
          { label: "Families Reached", value: val("familiesReached", "156"), sub: "+12 this month" },
          { label: "Field Visits", value: val("healthVisits", "48"), sub: "+8 this week" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-150 rounded-xl p-5">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{s.label}</p>
            <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT — 8 cols */}
        <div className="lg:col-span-8 space-y-6">

          {/* Agents Orchestration */}
          <div className="bg-white border border-slate-150 rounded-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <img src={jaliLogo} alt="" className="h-5 w-5" />
                <h2 className="text-sm font-semibold text-slate-900">Agent Orchestration</h2>
              </div>
              <span className="text-xs text-slate-400">4 agents</span>
            </div>
            <div className="divide-y divide-slate-50">
              {agents.map(a => (
                <div key={a.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-25 transition-colors group">
                  <div className="flex items-center gap-2 min-w-[140px]">
                    {statusIcon[a.status as keyof typeof statusIcon]}
                    <span className="text-sm font-medium text-slate-700">{a.name}</span>
                  </div>
                  <div className="flex-1 flex items-center gap-6 text-xs text-slate-400">
                    <span>Accuracy <span className="text-slate-600 font-medium">{a.accuracy}</span></span>
                    <span>Records <span className="text-slate-600 font-medium">{a.records}</span></span>
                    <span>Last run <span className="text-slate-600 font-medium">{a.lastRun}</span></span>
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded",
                    a.status === "active" ? "text-green-600 bg-green-50" : "text-slate-400 bg-slate-50"
                  )}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Cases */}
          <div className="bg-white border border-slate-150 rounded-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Priority Cases</h2>
              <button className="text-xs text-blue-600 hover:underline">View all</button>
            </div>
            <div className="divide-y divide-slate-50">
              {(stats?.cases?.length > 0 ? stats.cases : cases).map((c: any) => (
                <div key={c.name} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-25 transition-colors cursor-pointer group">
                  <Avatar className="h-9 w-9 border border-slate-100">
                    <AvatarFallback className="bg-slate-50 text-slate-600 text-xs font-medium">
                      {c.initials || c.name?.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800 truncate">{c.name}</p>
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded", urgencyLabel[c.urgency]?.cls)}>
                        {urgencyLabel[c.urgency]?.text}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                      <span>{c.type || c.caseType}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.location}</span>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", c.progress >= 75 ? "bg-green-500" : c.progress >= 40 ? "bg-amber-500" : "bg-red-400")}
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">{c.progress}% complete</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-slate-400 transition-colors" />
                </div>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-white border border-slate-150 rounded-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-900">Today's Visits</h2>
              </div>
              <span className="text-xs text-slate-400">3 scheduled</span>
            </div>
            <div className="p-5 space-y-0">
              {[
                { time: "09:00", name: "Grace Wanjiku", task: "Prenatal checkup", done: true },
                { time: "11:30", name: "Samuel Oduor", task: "Growth monitoring", done: false },
                { time: "14:00", name: "Fatuma Ali", task: "Vaccination follow-up", done: false },
              ].map((v, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    {v.done ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    ) : (
                      <Circle className={cn("h-4 w-4 mt-0.5", i === 1 ? "text-blue-500 fill-blue-500" : "text-slate-200")} />
                    )}
                    {i < 2 && <div className="w-px flex-1 min-h-[28px] bg-slate-100" />}
                  </div>
                  <div className={cn("pb-5 flex-1", v.done && "opacity-50")}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">{v.time}</span>
                      {i === 1 && <span className="text-[9px] font-semibold uppercase text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">now</span>}
                    </div>
                    <p className="text-sm text-slate-700 font-medium mt-0.5">{v.name}</p>
                    <p className="text-xs text-slate-400">{v.task}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — 4 cols */}
        <div className="lg:col-span-4 space-y-6">

          {/* AI Assistant (Chat + Voice) */}
          <div className="bg-white border border-slate-150 rounded-xl flex flex-col" style={{ height: "480px" }}>
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
              <img src={jaliLogo} alt="" className="h-5 w-5" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Jali Assistant</h3>
                <p className="text-[10px] text-slate-400">Swahili · English</p>
              </div>
              {messages.length > 0 && (
                <button onClick={() => setMessages([])} className="ml-auto text-[10px] text-slate-400 hover:text-slate-600">Clear</button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <img src={jaliLogo} alt="" className="h-10 w-10 opacity-20 mb-3" />
                  <p className="text-sm text-slate-400">Type or speak in Swahili or English</p>
                  <p className="text-xs text-slate-300 mt-1">"Habari, nataka msaada..."</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={cn(
                    "max-w-[85%] px-3.5 py-2.5 rounded-xl text-sm",
                    m.role === "user"
                      ? "bg-slate-800 text-white rounded-br-sm"
                      : "bg-slate-50 text-slate-700 border border-slate-100 rounded-bl-sm"
                  )}>
                    <p className="leading-relaxed">{m.text}</p>
                    {m.audio && m.role === "assistant" && (
                      <button onClick={() => playB64(m.audio!)} className="mt-1.5 flex items-center gap-1 text-xs text-blue-500 hover:underline">
                        <Volume2 className="h-3 w-3" /> Play
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {(isSending || isProcessingVoice) && (
                <div className="flex justify-start">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl rounded-bl-sm px-3.5 py-2.5">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input bar */}
            <div className="border-t border-slate-100 p-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={isRecording ? stopRec : startRec}
                  disabled={isProcessingVoice}
                  className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    isRecording ? "bg-red-500 text-white" : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  )}
                >
                  {isProcessingVoice ? <Loader2 className="h-4 w-4 animate-spin" /> :
                    isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendText()}
                  placeholder={isRecording ? "Recording..." : "Type a message..."}
                  disabled={isRecording}
                  className="flex-1 h-9 px-3 rounded-lg bg-slate-50 border border-slate-100 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-slate-200 disabled:opacity-50"
                />
                <button
                  onClick={sendText}
                  disabled={!chatInput.trim() || isSending}
                  className="h-9 w-9 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 hover:bg-slate-700 disabled:opacity-30 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="text-center text-[10px] text-slate-300 mt-2">
                {isRecording ? "Listening..." : "Swahili & English voice supported"}
              </p>
            </div>
          </div>

          {/* Live Events */}
          {events.length > 0 && (
            <div className="bg-white border border-slate-150 rounded-xl">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
                <Activity className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900">Live Events</h3>
              </div>
              <div className="p-3 space-y-1.5">
                {events.slice(0, 4).map((ev, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-400 px-2 py-2 rounded-lg bg-slate-25">
                    <span className="font-mono text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      {ev.topic.split(".").pop()?.toUpperCase()}
                    </span>
                    <span className="flex-1">New record</span>
                    <span className="text-[10px]">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
