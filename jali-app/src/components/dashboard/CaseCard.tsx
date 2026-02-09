import { cn } from "@/lib/utils";
import { MapPin, Clock, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface CaseCardProps {
  name: string;
  initials: string;
  caseType: string;
  location: string;
  urgency: "high" | "medium" | "low";
  lastVisit: string;
  progress: number;
}

const urgencyConfig = {
  high: { label: "Urgent", className: "bg-destructive/15 text-destructive" },
  medium: { label: "Medium", className: "bg-primary/15 text-primary" },
  low: { label: "Low", className: "bg-secondary/15 text-secondary" },
};

const CaseCard = ({
  name,
  initials,
  caseType,
  location,
  urgency,
  lastVisit,
  progress,
}: CaseCardProps) => {
  const urg = urgencyConfig[urgency];

  return (
    <div className="group bg-card rounded-2xl border border-border/40 p-5 hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 cursor-pointer">
      <div className="flex items-start gap-4">
        <Avatar className="h-11 w-11 border-2 border-primary/10 shrink-0">
          <AvatarFallback className="bg-primary/8 text-primary text-sm font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-foreground truncate">{name}</h4>
            <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full shrink-0", urg.className)}>
              {urg.label}
            </span>
          </div>

          <p className="text-xs text-muted-foreground mt-1">{caseType}</p>

          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {location}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {lastVisit}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Care plan progress</span>
              <span className="font-medium text-foreground">{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  progress >= 75 ? "bg-secondary" : progress >= 40 ? "bg-primary" : "bg-destructive"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-1 shrink-0" />
      </div>
    </div>
  );
};

export default CaseCard;
