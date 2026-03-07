import { useState } from "react";
import { Menu, X, Mail, Phone, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import jaliLogo from "@/assets/jali-logo.svg";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "#" },
    { name: "Causes", href: "#services" },
    { name: "Events", href: "#impact" },
    { name: "Blog", href: "#blog" },
    { name: "Contact", href: "#contact" },
    { name: "Documentation", href: "#docs" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col w-full">
      {/* Top Bar - White */}
      <div className="bg-white py-4 shadow-sm hidden md:block border-b">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <a href="#" className="flex items-center">
            <img src={jaliLogo} alt="Jali.ai Logo" className="h-12 w-auto" />
            <div className="ml-3">
              <span className="text-xl font-bold text-slate-900 block leading-none">Jali.ai</span>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Compassionate Health AI</span>
            </div>
          </a>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 rounded-full">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">Email us at</span>
                <span className="text-sm font-semibold text-slate-900">care@jali.ai</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 rounded-full">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">Call us now</span>
                <span className="text-sm font-semibold text-slate-900">+254 700 000 000</span>
              </div>
            </div>

            <Button variant="outline" className="text-secondary border-secondary hover:bg-secondary hover:text-white rounded-md px-8 font-bold">
              Donate now
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Bar - Teal */}
      <div className="bg-primary py-0 shadow-md">
        <div className="container mx-auto px-4 flex items-center justify-between h-14 md:h-16">
          {/* Mobile Logo */}
          <a href="#" className="md:hidden flex items-center">
            <img src={jaliLogo} alt="Jali.ai Logo" className="h-10 w-auto brightness-0 invert" />
            <span className="ml-2 text-white font-bold">Jali.ai</span>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-white hover:bg-white/10 px-4 py-2 text-sm font-semibold transition-all h-16 flex items-center"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button className="p-2 text-white hover:bg-white/10 rounded-full transition-colors hidden md:block">
              <Moon className="w-5 h-5" />
            </button>
            <div className="hidden md:flex items-center gap-2 ml-4">
              <Button variant="secondary" className="font-bold px-6">
                Sign In
              </Button>
              <Button variant="default" className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 border-none">
                Sign Up
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-primary border-t border-white/10 py-4 animate-in slide-in-from-top duration-300">
            <nav className="flex flex-col container mx-auto px-4 gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-white py-3 px-4 hover:bg-white/10 rounded-md font-semibold"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <div className="flex flex-col gap-3 mt-4 px-4 pb-4">
                <Button variant="secondary" className="w-full font-bold">
                  Sign In
                </Button>
                <Button className="w-full bg-slate-900 border-none font-bold text-white">
                  Sign Up
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
