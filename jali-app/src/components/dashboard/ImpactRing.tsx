import { cn } from "@/lib/utils";

interface ImpactRingProps {
  label: string;
  value: number;
  max: number;
  color: "primary" | "secondary" | "destructive";
  size?: "sm" | "md";
}

const colorMap = {
  primary: "stroke-primary",
  secondary: "stroke-secondary",
  destructive: "stroke-destructive",
};

const bgColorMap = {
  primary: "text-primary",
  secondary: "text-secondary",
  destructive: "text-destructive",
};

const ImpactRing = ({ label, value, max, color, size = "md" }: ImpactRingProps) => {
  const percentage = (value / max) * 100;
  const dimensions = size === "md" ? 100 : 72;
  const strokeWidth = size === "md" ? 8 : 6;
  const radius = (dimensions - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: dimensions, height: dimensions }}>
        <svg
          className="transform -rotate-90"
          width={dimensions}
          height={dimensions}
        >
          <circle
            cx={dimensions / 2}
            cy={dimensions / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={dimensions / 2}
            cy={dimensions / 2}
            r={radius}
            fill="none"
            className={cn(colorMap[color])}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-lg font-bold", bgColorMap[color])}>{value}</span>
          <span className="text-[10px] text-muted-foreground">/ {max}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground font-medium text-center">{label}</span>
    </div>
  );
};

export default ImpactRing;
