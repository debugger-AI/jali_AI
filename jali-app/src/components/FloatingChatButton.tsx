import { useState } from "react";
import { MessageCircle, X, Send, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const FloatingChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const contactOptions = [
    {
      icon: MessageCircle,
      label: "WhatsApp",
      href: "https://wa.me/15551234567", // Replace with actual WhatsApp number
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      icon: Mail,
      label: "Email Us",
      href: "mailto:hello@jali.ai",
      color: "bg-primary hover:bg-primary/90",
    },
    {
      icon: Phone,
      label: "Call Us",
      href: "tel:+15551234567",
      color: "bg-secondary hover:bg-secondary/90",
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Contact Options */}
      <div
        className={`flex flex-col gap-3 transition-all duration-300 ${
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {contactOptions.map((option, index) => (
          <a
            key={option.label}
            href={option.href}
            target={option.label === "WhatsApp" ? "_blank" : undefined}
            rel={option.label === "WhatsApp" ? "noopener noreferrer" : undefined}
            className={`flex items-center gap-3 px-4 py-3 rounded-full text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl ${option.color}`}
            style={{ transitionDelay: `${index * 50}ms` }}
          >
            <option.icon size={20} />
            <span className="font-medium text-sm">{option.label}</span>
          </a>
        ))}
      </div>

      {/* Main FAB Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className={`w-14 h-14 rounded-full shadow-xl transition-all duration-300 hover:scale-110 ${
          isOpen
            ? "bg-foreground hover:bg-foreground/90 rotate-0"
            : "bg-gradient-to-br from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
        }`}
      >
        <div className="relative">
          <MessageCircle
            size={24}
            className={`absolute inset-0 transition-all duration-300 ${
              isOpen ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
            }`}
          />
          <X
            size={24}
            className={`transition-all duration-300 ${
              isOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
            }`}
          />
        </div>
        
        {/* Subtle pulse animation when closed */}
        {!isOpen && (
          <span className="absolute inset-1 rounded-full bg-white/20 animate-pulse" />
        )}
      </Button>

      {/* Tooltip when closed */}
      {!isOpen && (
        <div className="absolute right-16 bottom-3 bg-card px-3 py-2 rounded-lg shadow-lg border border-border whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          <p className="text-sm font-medium text-foreground">Need help? Chat with us!</p>
        </div>
      )}
    </div>
  );
};

export default FloatingChatButton;
