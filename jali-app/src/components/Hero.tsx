import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, MapPin } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import { useParallax } from "@/hooks/use-parallax";
const Hero = () => {
  const parallaxOffset = useParallax(0.4);
  return <section className="relative min-h-screen flex items-center overflow-hidden">
    {/* Full-bleed background image with parallax */}
    <div className="absolute inset-0">
      <img src={heroImage} alt="Mothers and children receiving healthcare in a community setting" className="w-full h-[120%] object-cover transition-transform duration-100 ease-out" style={{
        transform: `translateY(${parallaxOffset}px) scale(1.1)`
      }} />
      {/* Subtle gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/40 to-transparent" />
    </div>

    <div className="container mx-auto px-4 relative z-10 pt-20 flex items-center justify-center">
      <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
        {/* Main Headline - Elegant serif-style */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-light text-background mb-6 leading-tight tracking-tight text-center whitespace-nowrap">
          AI Powered Extension for <span className="font-normal">Social Workers</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-background/90 max-w-xl mx-auto mb-10 leading-relaxed">
          Leveraging <span className="font-semibold">artificial intelligence</span> to strengthen
          community health systems, support <span className="font-semibold">frontline health workers</span>,
          and deliver <span className="font-semibold">life-saving care</span> to those who need it most.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="xl" variant="hero" className="group">
            Explore Our Platform
            <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
          </Button>
          <Link to="/login">
            <Button size="xl" variant="warm" className="group">
              Get Started
              <ArrowRight size={18} className="ml-1 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>

    {/* Bottom section with location and video CTA */}
    <div className="absolute bottom-0 left-0 right-0 z-10">
      <div className="container mx-auto px-4 pb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          {/* Location indicator */}
          <div className="flex items-center gap-2 text-background/80">
            <MapPin size={16} />
            <span className="text-sm">Serving communities across Kenya</span>
          </div>

          {/* Video CTA */}
          <div className="flex items-center gap-4">
            <button className="relative w-14 h-14 rounded-full bg-background/20 backdrop-blur-sm border border-background/30 flex items-center justify-center hover:bg-background/30 transition-all duration-300 group hover:scale-110">
              {/* Pulse ring animation */}
              <span className="absolute inset-0 rounded-full bg-background/20 animate-ping" />
              <Play size={20} className="text-background ml-1 relative z-10" fill="currentColor" />
            </button>
            <p className="text-sm text-background/90 max-w-[200px] hidden sm:block">
              Watch how Jali.ai helps communities and families access AI technology to better themselves           <span className="font-semibold">mothers and children</span> access better healthcare.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>;
};
export default Hero;