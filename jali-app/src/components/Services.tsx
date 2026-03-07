import { Pill, Activity, Syringe, Calendar } from "lucide-react";

const services = [
  {
    icon: Pill,
    title: "HIV Adherence",
    description: "AI-driven reminders and educational support to ensure consistent medication adherence for HIV+ mothers, promoting long-term health.",
    color: "bg-teal-500",
  },
  {
    icon: Activity,
    title: "TB Adherence",
    description: "Personalized tracking and guidance for Tuberculosis treatment, helping patients stay on course and prevent drug resistance.",
    color: "bg-pink-500",
  },
  {
    icon: Syringe,
    title: "Immunization",
    description: "Automated vaccination schedules and alerts for children, ensuring timely protection against preventable diseases.",
    color: "bg-teal-600",
  },
  {
    icon: Calendar,
    title: "Family Planning",
    description: "Comprehensive menstrual health tracking and reproductive education to empower women with knowledge about their bodies.",
    color: "bg-pink-600",
  },
];

const Services = () => {
  return (
    <section id="services" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <p className="text-secondary font-black uppercase tracking-[0.2em] text-xs mb-4">Urgent Causes</p>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">
            We Help the People in Need
          </h2>
          <div className="w-16 h-1 bg-primary mx-auto mb-8 rounded-full" />
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {services.map((service, index) => (
            <div
              key={service.title}
              className="flex flex-col bg-slate-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group"
            >
              <div className={`h-48 ${service.color} flex items-center justify-center relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <service.icon size={80} className="text-white/20 absolute -right-4 -bottom-4 group-hover:scale-110 transition-transform" />
                <service.icon size={64} className="text-white relative z-10 drop-shadow-lg group-hover:scale-110 transition-transform" />
              </div>
              <div className="p-8 flex flex-col flex-grow">
                <h3 className="text-2xl font-black text-slate-900 mb-4">
                  {service.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-grow">
                  {service.description}
                </p>
                <button className="text-xs font-bold uppercase tracking-widest text-primary hover:text-secondary transition-colors flex items-center gap-2">
                  Read more <span>→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
