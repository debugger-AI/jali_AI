import { Bot, Baby, BookOpen, Stethoscope } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

const services = [
  {
    icon: Bot,
    title: "AI Health Assistant",
    description: "Get instant, reliable answers to your health questions in your local language. Available 24/7 for guidance when you need it most.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Baby,
    title: "Maternal Care Support",
    description: "Comprehensive guidance for expectant and new mothers. From prenatal care to postnatal support, we're here every step of the way.",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    icon: BookOpen,
    title: "Community Education",
    description: "Health literacy programs designed for communities. Empowering families with knowledge to make informed health decisions.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Stethoscope,
    title: "Healthcare Access",
    description: "Connecting underserved populations to essential healthcare services. Bridging the gap between communities and quality care.",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
];

const Services = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section id="services" className="py-20 md:py-32 bg-muted/30">
      <div
        ref={ref}
        className={`container mx-auto px-4 transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Our Services</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-4 mb-6">
            How We Help Communities Thrive
          </h2>
          <p className="text-lg text-muted-foreground">
            Through innovative AI technology and compassionate care, we provide accessible health solutions 
            tailored to the needs of mothers, children, and communities.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {services.map((service, index) => (
            <Card
              key={service.title}
              className={`group hover:shadow-xl transition-all duration-500 border-border/50 bg-card hover:-translate-y-2 cursor-pointer ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <CardHeader className="pb-4">
                <div className={`w-14 h-14 rounded-2xl ${service.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <service.icon size={28} className={`${service.color} transition-transform duration-300`} />
                </div>
                <CardTitle className="text-xl md:text-2xl group-hover:text-primary transition-colors duration-300">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {service.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      </div>
    </section>
  );
};

export default Services;
