import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HowToHelp from "@/components/HowToHelp";
import Services from "@/components/Services";
import ImpactMap from "@/components/ImpactMap";
import ImpactNumbers from "@/components/ImpactNumbers";
import Footer from "@/components/Footer";


const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <HowToHelp />
        <Services />
        <ImpactMap />
        <ImpactNumbers />
      </main>
      <Footer />

    </div>
  );
};

export default Index;
