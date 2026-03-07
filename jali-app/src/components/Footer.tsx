import { Mail, MapPin, Phone, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import jaliLogo from "@/assets/jali-logo.svg";

const Footer = () => {
  const causesLinks = [
    { name: "HIV Adherence", href: "#services" },
    { name: "TB Adherence", href: "#services" },
    { name: "Immunization", href: "#services" },
    { name: "Family Planning", href: "#services" },
  ];

  const otherLinks = [
    { name: "About Us", href: "#about" },
    { name: "Blog", href: "#blog" },
    { name: "Events", href: "#impact" },
    { name: "Contact Us", href: "#contact" },
  ];

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Instagram, href: "#", label: "Instagram" },
  ];

  return (
    <footer id="contact" className="bg-slate-50 border-t">
      {/* Newsletter Banner */}
      <div className="bg-gradient-to-r from-primary to-teal-600">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-white mb-2">Stay informed</h3>
              <p className="text-white/80 text-sm">
                Subscribe to our newsletter for the latest updates on our mission.
              </p>
            </div>
            <div className="flex gap-3">
              <Input
                type="email"
                placeholder="Your email address"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-14 rounded-md"
              />
              <Button className="bg-secondary hover:bg-secondary/90 text-white h-14 px-8 rounded-md font-bold shrink-0">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <a href="#" className="flex items-center gap-3 mb-6">
              <img src={jaliLogo} alt="Jali.ai Logo" className="h-10 w-auto" />
              <div>
                <span className="text-xl font-bold text-slate-900 block leading-none">Jali.ai</span>
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Compassionate Health AI</span>
              </div>
            </a>
            <p className="text-slate-500 mb-6 text-sm leading-relaxed">
              Empowering underserved communities with AI-powered healthcare solutions.
              Every mother, every child deserves access to quality health support.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300 text-slate-600"
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Causes */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-6">Causes</h3>
            <ul className="space-y-3">
              {causesLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-slate-500 hover:text-primary transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Other Links */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-6">Other Links</h3>
            <ul className="space-y-3">
              {otherLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-slate-500 hover:text-primary transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-6">Contact Info</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-primary mt-0.5 shrink-0" />
                <span className="text-slate-500 text-sm">Nairobi, Kenya</span>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={18} className="text-primary mt-0.5 shrink-0" />
                <span className="text-slate-500 text-sm">care@jali.ai</span>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={18} className="text-primary mt-0.5 shrink-0" />
                <span className="text-slate-500 text-sm">+254 700 000 000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} Jali.ai. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-slate-400">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
