import { useEffect, useState, useRef } from "react";
import { Users, Heart, MessageCircle, Globe } from "lucide-react";

const stats = [
  {
    icon: Globe,
    value: 103,
    suffix: "+",
    label: "Communities Served",
    description: "Across 4 continents",
  },
  {
    icon: Heart,
    value: 50000,
    suffix: "+",
    label: "Mothers Helped",
    description: "Maternal care support",
  },
  {
    icon: MessageCircle,
    value: 250000,
    suffix: "+",
    label: "Health Questions Answered",
    description: "Via AI assistant",
  },
  {
    icon: Users,
    value: 1000000,
    suffix: "+",
    label: "Lives Impacted",
    description: "And growing daily",
  },
];

const AnimatedCounter = ({ value, suffix }: { value: number; suffix: string }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 2000;
          const steps = 60;
          const stepValue = value / steps;
          let current = 0;

          const timer = setInterval(() => {
            current += stepValue;
            if (current >= value) {
              setCount(value);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, hasAnimated]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + "K";
    }
    return num.toString();
  };

  return (
    <div ref={ref} className="text-4xl md:text-5xl lg:text-6xl font-black text-primary">
      {formatNumber(count)}{suffix}
    </div>
  );
};

const ImpactNumbers = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-secondary font-black uppercase tracking-[0.2em] text-xs mb-4">Our Impact</p>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">
            Numbers That Tell Our Story
          </h2>
          <div className="w-16 h-1 bg-primary mx-auto mb-8 rounded-full" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="text-center p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-2 cursor-pointer group"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                <stat.icon size={32} className="text-primary" />
              </div>
              <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              <p className="text-lg font-bold text-slate-900 mt-3">{stat.label}</p>
              <p className="text-sm text-slate-500 mt-1">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImpactNumbers;
