import { MapPin } from "lucide-react";

const regions = [
  { name: "Sub-Saharan Africa", communities: 45, position: { top: "55%", left: "52%" } },
  { name: "South Asia", communities: 28, position: { top: "45%", left: "70%" } },
  { name: "Southeast Asia", communities: 18, position: { top: "55%", left: "78%" } },
  { name: "Latin America", communities: 12, position: { top: "60%", left: "28%" } },
];

const ImpactMap = () => {
  return (
    <section id="impact" className="py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-secondary font-black uppercase tracking-[0.2em] text-xs mb-4">Our Reach</p>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">
            Making an Impact Globally
          </h2>
          <div className="w-16 h-1 bg-primary mx-auto mb-8 rounded-full" />
          <p className="text-slate-500 text-lg">
            From rural villages to urban communities, Jali.ai is bridging healthcare gaps
            and empowering families across continents.
          </p>
        </div>

        {/* Map Visualization */}
        <div className="relative max-w-5xl mx-auto">
          <div className="relative aspect-[2/1] bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <svg
              viewBox="0 0 1000 500"
              className="w-full h-full opacity-30"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse cx="520" cy="280" rx="80" ry="100" className="fill-teal-200" />
              <ellipse cx="500" cy="150" rx="60" ry="50" className="fill-teal-100" />
              <ellipse cx="700" cy="200" rx="120" ry="80" className="fill-teal-100" />
              <ellipse cx="250" cy="180" rx="100" ry="70" className="fill-teal-100" />
              <ellipse cx="300" cy="350" rx="60" ry="90" className="fill-teal-200" />
              <ellipse cx="820" cy="380" rx="50" ry="40" className="fill-teal-100" />
            </svg>

            {regions.map((region, index) => (
              <div
                key={region.name}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                style={{ top: region.position.top, left: region.position.left }}
              >
                <div className="absolute inset-0 w-8 h-8 -m-4 bg-primary/20 rounded-full animate-ping" style={{ animationDelay: `${index * 200}ms` }} />
                <div className="relative z-10 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg group-hover:scale-125 transition-transform">
                  <MapPin size={16} className="text-white" />
                </div>

                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-slate-200 whitespace-nowrap">
                    <p className="font-bold text-slate-900 text-sm">{region.name}</p>
                    <p className="text-xs text-slate-500">{region.communities} communities</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Region Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {regions.map((region) => (
              <div
                key={region.name}
                className="bg-white p-6 rounded-2xl border border-slate-200 text-center hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 transition-all duration-300 cursor-pointer"
              >
                <p className="text-3xl font-black text-primary">{region.communities}</p>
                <p className="text-sm text-slate-500 mt-1 font-medium">{region.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ImpactMap;
