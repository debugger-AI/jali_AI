import { Plus, FileText, MapPin, Phone, Sparkles, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  {
    icon: Plus,
    label: "New Case",
    description: "Start a new case file",
    accent: "primary" as const,
  },
  {
    icon: MapPin,
    label: "Log Visit",
    description: "Record a field visit",
    accent: "secondary" as const,
  },
  {
    icon: Sparkles,
    label: "AI Insights",
    description: "Get recommendations",
    accent: "primary" as const,
  },
  {
    icon: FileText,
    label: "Report",
    description: "Generate a report",
    accent: "secondary" as const,
  },
  {
    icon: Calendar,
    label: "Schedule",
    description: "Plan visits",
    accent: "primary" as const,
  },
  {
    icon: Phone,
    label: "Contact",
    description: "Reach a colleague",
    accent: "secondary" as const,
  },
];

const accentBg = {
  primary: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
  secondary: "bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-secondary-foreground",
};

const QuickActions = () => {
  return (
    <div className="bg-card rounded-2xl border border-border/40 p-6">
      <h3 className="text-lg font-semibold text-foreground mb-5">Quick Actions</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            className="group flex flex-col items-center gap-2.5 p-4 rounded-xl bg-muted/30 hover:bg-muted/60 border border-transparent hover:border-border/40 transition-all duration-200 cursor-pointer"
          >
            <div className={cn("p-2.5 rounded-xl transition-all duration-200", accentBg[action.accent])}>
              <action.icon className="h-5 w-5" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{action.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">{action.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
