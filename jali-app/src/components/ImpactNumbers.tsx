import { useEffect, useState, useRef } from "react";
import { Users, Heart, MessageCircle, Globe } from "lucide-react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

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
    <div ref={ref} className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary">
      {formatNumber(count)}{suffix}
    </div>
  );
};

const ImpactNumbers = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section className="py-20 md:py-28 bg-gradient-to-r from-secondary/5 via-primary/5 to-secondary/5">
      <div
        ref={ref}
        className={`container mx-auto px-4 transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Our Impact</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-4 mb-6">
            Numbers That Tell Our Story
          </h2>
          <p className="text-lg text-muted-foreground">
            Every number represents a family empowered, a mother supported, 
            and a community strengthened through accessible healthcare.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`text-center p-6 rounded-3xl bg-card border border-border hover:shadow-xl hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 cursor-pointer group ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <stat.icon size={32} className="text-primary" />
              </div>
              <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              <p className="text-lg font-semibold text-foreground mt-2 group-hover:text-primary transition-colors duration-300">{stat.label}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImpactNumbers;
