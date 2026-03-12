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
import { Calendar } from "@/components/ui/calendar";
import jaliLogo from "@/assets/jali-logo.svg";

const API_BASE = "http://localhost:8000";



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



// ═════════════════════════════════════════════════════════
const Dashboard = () => {
  const { events, isConnected } = useRealtime();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());



  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Role info
  const role = localStorage.getItem("jali_role") || "chv";
  const isManager = role === "case_manager";

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



  const val = (k: string, fb: string) => isLoading ? "—" : stats?.[k]?.value || fb;

  return (
    <div className="max-w-[1200px] mx-auto animate-in fade-in duration-300">

      {/* ── HEADER ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent tracking-tight">
            {greeting}
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
        {(isManager ? [
          { label: "Active CHVs", value: "12", sub: "+2 this month", color: "bg-blue-50 border-blue-100 text-blue-900" },
          { label: "Families Reached", value: val("familiesReached", "1,204"), sub: "+45 this week", color: "bg-amber-50 border-amber-100 text-amber-900" },
          { label: "Urgent Escaltions", value: "7", sub: "-2 from yesterday", color: "bg-red-50 border-red-100 text-red-900" },
        ] : [
          { label: "Active Cases", value: val("activeCases", "24"), sub: "+3 this week", color: "bg-emerald-50 border-emerald-100 text-emerald-900" },
          { label: "Families Reached", value: val("familiesReached", "156"), sub: "+12 this month", color: "bg-blue-50 border-blue-100 text-blue-900" },
          { label: "Field Visits", value: val("healthVisits", "48"), sub: "+8 this week", color: "bg-purple-50 border-purple-100 text-purple-900" },
        ]).map(s => (
          <div key={s.label} className={cn("border rounded-xl p-5 shadow-sm", s.color)}>
            <p className="text-xs uppercase tracking-wide mb-1 opacity-70 font-semibold">{s.label}</p>
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-xs mt-1 opacity-60 font-medium">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT — 8 cols */}
        <div className="lg:col-span-8 space-y-6">



          {/* Priority Cases */}
          <div className="bg-white border border-emerald-100 rounded-xl shadow-[0_4px_20px_-10px_rgba(16,185,129,0.1)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-50 bg-emerald-50/30">
              <h2 className="text-sm font-semibold text-slate-900">
                {isManager ? "Escalated Priority Cases" : "My Priority Cases"}
              </h2>
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

          {/* Schedule - CHV Only */}
          {!isManager && (
            <div className="bg-white border border-blue-100 rounded-xl shadow-[0_4px_20px_-10px_rgba(59,130,246,0.1)]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-blue-50 bg-blue-50/30">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-blue-500" />
                  <h2 className="text-sm font-semibold text-slate-900">Today's Visits & Reminders</h2>
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
                      <p className="text-xs text-slate-500">{v.task}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — 4 cols */}
        <div className="lg:col-span-4 space-y-6">

          {/* Tracking Calendar */}
          <div className="bg-white border border-slate-150 rounded-xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <CalendarDays className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-slate-900">Family & Individual Tracking</h3>
            </div>
            
            <div className="p-4 flex flex-col items-center border-b border-slate-100">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md"
              />
            </div>

            <div className="p-4 bg-slate-50/30">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Tracking for {date ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Selected Date"}
                </h4>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">3 tasks</span>
              </div>
              
              <div className="space-y-4">
                {/* Simulated individual tracking tasks */}
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)] shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-700 leading-tight">Aisha Kamau <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 ml-1">High Risk</span></p>
                    <p className="text-xs text-slate-500 mt-1">Scheduled home visit for 3rd trimester vitals check.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)] shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-700 leading-tight">Ochieng Family <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 ml-1">Follow-up</span></p>
                    <p className="text-xs text-slate-500 mt-1">Ensure TB medication adherence (Day 14 checkpoint).</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-700 leading-tight">Muthoni Infant <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 ml-1">Routine</span></p>
                    <p className="text-xs text-slate-500 mt-1">Polio & BCG vaccine reminder at the clinic.</p>
                  </div>
                </div>
              </div>
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
