import { Button } from "@/components/ui/button";
import { ArrowRight, Heart } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 md:pt-44 pb-20 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Maternal Health"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-xl bg-white p-8 md:p-12 rounded-lg shadow-2xl animate-in fade-in slide-in-from-left duration-1000">
          <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            <Heart size={14} className="text-secondary" />
            Helping African Mothers
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-6 leading-tight">
            AI-Powered Health for Every <span className="text-primary italic">Mother</span> & Child.
          </h1>

          <p className="text-slate-600 text-lg mb-8 leading-relaxed">
            Empowering community health workers with cutting-edge AI to provide
            compassionate, life-saving care to underserved families across the globe.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="border-l-4 border-primary pl-4">
              <span className="block text-2xl font-black text-slate-900">1.2M+</span>
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Lives Impacted</span>
            </div>
            <div className="border-l-4 border-secondary pl-4">
              <span className="block text-2xl font-black text-slate-900">500+</span>
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Health Centers</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="bg-secondary hover:bg-secondary/90 text-white h-14 px-8 rounded-md font-bold text-lg group">
              Donate now
              <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="outline" className="border-slate-200 text-slate-700 h-14 px-8 rounded-md font-bold text-lg hover:bg-slate-50">
              Our Mission
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;