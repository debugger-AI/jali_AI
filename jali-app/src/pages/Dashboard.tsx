import { Users, FolderOpen, HeartPulse, TrendingUp, Sparkles } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import CaseCard from "@/components/dashboard/CaseCard";
import QuickActions from "@/components/dashboard/QuickActions";
import ImpactRing from "@/components/dashboard/ImpactRing";

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
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? "Good morning" : currentHour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Greeting header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-light text-foreground">
            {greeting}, <span className="font-semibold">Amara</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening in your community today.
          </p>
        </div>

      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Cases"
          value="24"
          change="+3"
          changeType="positive"
          icon={FolderOpen}
          accent="primary"
        />
        <StatCard
          title="Families Reached"
          value="156"
          change="+12"
          changeType="positive"
          icon={Users}
          accent="secondary"
        />
        <StatCard
          title="Health Visits"
          value="48"
          change="+8"
          changeType="positive"
          icon={HeartPulse}
          accent="secondary"
        />
        <StatCard
          title="Impact Score"
          value="92%"
          change="+5%"
          changeType="positive"
          icon={TrendingUp}
          accent="primary"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Cases + Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Priority cases */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Priority Cases</h3>
              <button className="text-sm text-primary hover:underline">View all cases</button>
            </div>
            <div className="space-y-3">
              {cases.map((c) => (
                <CaseCard key={c.name} {...c} />
              ))}
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
