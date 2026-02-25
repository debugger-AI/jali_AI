import { useState, useEffect } from "react";
import { Users, FolderOpen, HeartPulse, TrendingUp, Sparkles, Activity, Signal, SignalLow } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import CaseCard from "@/components/dashboard/CaseCard";
import QuickActions from "@/components/dashboard/QuickActions";
import ImpactRing from "@/components/dashboard/ImpactRing";
import { useRealtime } from "@/hooks/useRealtime";
import { Badge } from "@/components/ui/badge";

const cases = [
  {
    name: "Grace Wanjiku",
    initials: "GW",
    caseType: "Maternal Health — Prenatal Care",
    location: "Kibera, Nairobi",
    urgency: "high" as const,
    lastVisit: "2 days ago",
    progress: 35,
  },
  {
    name: "Samuel Oduor",
    initials: "SO",
    caseType: "Child Nutrition — Growth Monitoring",
    location: "Mathare, Nairobi",
    urgency: "medium" as const,
    lastVisit: "5 days ago",
    progress: 68,
  },
  {
    name: "Fatuma Ali",
    initials: "FA",
    caseType: "Immunization — Under-5 Follow-Up",
    location: "Eastleigh, Nairobi",
    urgency: "low" as const,
    lastVisit: "1 week ago",
    progress: 90,
  },
];

const Dashboard = () => {
  const { events, isConnected } = useRealtime();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    // Refresh stats every 30 seconds if live
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? "Good morning" : currentHour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Greeting header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-light text-foreground">
              {greeting}, <span className="font-semibold">Amara</span>
            </h1>
            <Badge variant={isConnected ? "success" : "secondary"} className="h-6 gap-1.5 px-3">
              {isConnected ? (
                <>
                  <Signal className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-medium">Live</span>
                </>
              ) : (
                <>
                  <SignalLow className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground font-medium">Offline</span>
                </>
              )}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Here's what's happening in your community today.
          </p>
        </div>

      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Cases"
          value={isLoading ? "..." : stats?.activeCases?.value || "24"}
          change={stats?.activeCases?.change || "+3"}
          changeType="positive"
          icon={FolderOpen}
          accent="primary"
        />
        <StatCard
          title="Families Reached"
          value={isLoading ? "..." : stats?.familiesReached?.value || "156"}
          change={stats?.familiesReached?.change || "+12"}
          changeType="positive"
          icon={Users}
          accent="secondary"
        />
        <StatCard
          title="Health Visits"
          value={isLoading ? "..." : stats?.healthVisits?.value || "48"}
          change={stats?.healthVisits?.change || "+8"}
          changeType="positive"
          icon={HeartPulse}
          accent="secondary"
        />
      </div>

      {/* Real-time Events Feed (only show if there are events) */}
      {events.length > 0 && (
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-2xl p-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Real-time Stream</h3>
          </div>
          <div className="space-y-3">
            {events.slice(0, 3).map((event, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm bg-background/50 p-3 rounded-lg border border-border/40">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-primary px-2 py-0.5 bg-primary/10 rounded">
                    {event.topic.split('.').pop()?.toUpperCase()}
                  </span>
                  <span className="text-muted-foreground">New record added</span>
                </div>
                <span className="text-xs text-muted-foreground/60">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Cases + Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Priority cases */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Priority Cases (Live from Snowflake)</h3>
              <button className="text-sm text-primary hover:underline">View all cases</button>
            </div>
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-sm text-muted-foreground animate-pulse">Loading live cases...</div>
              ) : stats?.cases?.length > 0 ? (
                stats.cases.map((c: any) => (
                  <CaseCard key={c.name} {...c} />
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No priority cases currently found.</div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <QuickActions />
        </div>

        {/* Right column: Activity + Impact */}
        <div className="space-y-6">
          {/* Impact rings */}
          <div className="bg-card rounded-2xl border border-border/40 p-6">
            <h3 className="text-lg font-semibold text-foreground mb-5">Weekly Goals</h3>
            <div className="flex justify-around">
              <ImpactRing label="Visits" value={12} max={20} color="primary" />
              <ImpactRing label="Reports" value={7} max={10} color="secondary" />
              <ImpactRing label="Follow-ups" value={5} max={8} color="destructive" />
            </div>
          </div>

          {/* Activity timeline */}
          <ActivityTimeline />
        </div>
      </div>
    </div>
  );
};


export default Dashboard;
