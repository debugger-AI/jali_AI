import { MapPin } from "lucide-react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

const regions = [
  { name: "Sub-Saharan Africa", communities: 45, position: { top: "55%", left: "52%" } },
  { name: "South Asia", communities: 28, position: { top: "45%", left: "70%" } },
  { name: "Southeast Asia", communities: 18, position: { top: "55%", left: "78%" } },
  { name: "Latin America", communities: 12, position: { top: "60%", left: "28%" } },
];

const ImpactMap = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section id="impact" className="py-20 md:py-32 bg-background">
      <div
        ref={ref}
        className={`container mx-auto px-4 transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-secondary font-semibold text-sm uppercase tracking-wider">Our Reach</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-4 mb-6">
            Making an Impact Globally
          </h2>
          <p className="text-lg text-muted-foreground">
            From rural villages to urban communities, Jali.ai is bridging healthcare gaps 
            and empowering families across continents.
          </p>
        </div>

        {/* Map Visualization */}
        <div className="relative max-w-5xl mx-auto">
          {/* Stylized World Map Background */}
          <div className="relative aspect-[2/1] bg-gradient-to-br from-muted to-muted/50 rounded-2xl overflow-hidden border border-border">
            {/* Simple world map representation using CSS */}
            <svg
              viewBox="0 0 1000 500"
              className="w-full h-full opacity-20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Africa */}
              <ellipse cx="520" cy="280" rx="80" ry="100" className="fill-secondary/30" />
              {/* Europe */}
              <ellipse cx="500" cy="150" rx="60" ry="50" className="fill-primary/30" />
              {/* Asia */}
              <ellipse cx="700" cy="200" rx="120" ry="80" className="fill-secondary/30" />
              {/* North America */}
              <ellipse cx="250" cy="180" rx="100" ry="70" className="fill-primary/30" />
              {/* South America */}
              <ellipse cx="300" cy="350" rx="60" ry="90" className="fill-secondary/30" />
              {/* Australia */}
              <ellipse cx="820" cy="380" rx="50" ry="40" className="fill-primary/30" />
            </svg>

            {/* Impact Points */}
            {regions.map((region, index) => (
              <div
                key={region.name}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                style={{ top: region.position.top, left: region.position.left }}
              >
                {/* Pulsing circle */}
                <div className="absolute inset-0 w-8 h-8 -m-4 bg-primary/20 rounded-full animate-ping" style={{ animationDelay: `${index * 200}ms` }} />
                <div className="relative z-10 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg group-hover:scale-125 transition-transform">
                  <MapPin size={16} className="text-primary-foreground" />
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-card px-4 py-2 rounded-lg shadow-lg border border-border whitespace-nowrap">
                    <p className="font-semibold text-foreground text-sm">{region.name}</p>
                    <p className="text-xs text-muted-foreground">{region.communities} communities</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Region Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {regions.map((region, index) => (
              <div
                key={region.name}
                className={`bg-card p-4 rounded-2xl border border-border text-center hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 transition-all duration-300 cursor-pointer ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 100 + 300}ms` }}
              >
                <p className="text-2xl md:text-3xl font-bold text-primary">{region.communities}</p>
                <p className="text-sm text-muted-foreground mt-1">{region.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </section>
  );
};

export default ImpactMap;
