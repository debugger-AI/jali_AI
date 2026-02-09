import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  accent?: "primary" | "secondary" | "muted";
}

const StatCard = ({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  accent = "primary",
}: StatCardProps) => {
  const accentStyles = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    muted: "bg-muted text-muted-foreground",
  };

  return (
    <div className="group relative bg-card rounded-2xl p-6 border border-border/40 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden">
      {/* Decorative gradient blob */}
      <div
        className={cn(
          "absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          accent === "primary" && "bg-primary/20",
          accent === "secondary" && "bg-secondary/20",
          accent === "muted" && "bg-muted"
        )}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full",
                changeType === "positive" && "bg-secondary/15 text-secondary",
                changeType === "negative" && "bg-destructive/15 text-destructive",
                changeType === "neutral" && "bg-muted text-muted-foreground"
              )}
            >
              {change}
            </span>
            <span className="text-xs text-muted-foreground">vs last month</span>
          </div>
        </div>

        <div className={cn("p-3 rounded-xl", accentStyles[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
