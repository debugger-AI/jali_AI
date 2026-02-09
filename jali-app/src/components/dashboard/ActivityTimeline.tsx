import { cn } from "@/lib/utils";

interface TimelineItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "case" | "visit" | "alert" | "report";
}

const activities: TimelineItem[] = [
  {
    id: "1",
    title: "New case assigned",
    description: "Maternal health follow-up in Kibera district",
    time: "10 min ago",
    type: "case",
  },
  {
    id: "2",
    title: "Field visit completed",
    description: "Community vaccination drive — 45 children reached",
    time: "1 hour ago",
    type: "visit",
  },
  {
    id: "3",
    title: "AI Alert",
    description: "Nutrition risk detected for 3 households in Zone B",
    time: "2 hours ago",
    type: "alert",
  },
  {
    id: "4",
    title: "Report submitted",
    description: "Monthly community health assessment — Q1 2026",
    time: "4 hours ago",
    type: "report",
  },
  {
    id: "5",
    title: "Case resolved",
    description: "Prenatal care plan completed successfully",
    time: "Yesterday",
    type: "case",
  },
];

const typeStyles = {
  case: "bg-primary/15 border-primary/30",
  visit: "bg-secondary/15 border-secondary/30",
  alert: "bg-destructive/15 border-destructive/30",
  report: "bg-muted border-border",
};

const dotStyles = {
  case: "bg-primary",
  visit: "bg-secondary",
  alert: "bg-destructive",
  report: "bg-muted-foreground",
};

const ActivityTimeline = () => {
  return (
    <div className="bg-card rounded-2xl border border-border/40 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        <button className="text-sm text-primary hover:underline">View all</button>
      </div>

      <div className="space-y-1">
        {activities.map((activity, index) => (
          <div key={activity.id} className="flex gap-4 group">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-3 h-3 rounded-full border-2 mt-1.5 transition-transform group-hover:scale-125",
                  typeStyles[activity.type],
                  dotStyles[activity.type]
                )}
              />
              {index < activities.length - 1 && (
                <div className="w-px flex-1 bg-border/60 my-1" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{activity.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                  {activity.time}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityTimeline;
