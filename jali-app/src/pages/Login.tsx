import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ArrowRight, Eye, EyeOff, MapPin } from "lucide-react";
import jaliLogo from "@/assets/jali-logo.svg";
import loginBg from "@/assets/hero-image.jpg";
import countyData from "@/data/county_data.json";

interface County {
  name: string;
  constituencies: {
    name: string;
    wards: any[];
  }[];
}

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<"chv" | "case_manager">("chv");

  // Location states
  const [selectedCounty, setSelectedCounty] = useState<string>("");
  const [selectedConstituency, setSelectedConstituency] = useState<string>("");

  // Sort counties alphabetically
  const counties = useMemo(() => {
    return [...(countyData as County[])].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Find current county data
  const currentCounty = useMemo(() =>
    counties.find(c => c.name === selectedCounty),
    [selectedCounty, counties]
  );

  // Sort constituencies alphabetically
  const constituencies = useMemo(() => {
    if (!currentCounty) return [];
    return [...currentCounty.constituencies].sort((a, b) => a.name.localeCompare(b.name));
  }, [currentCounty]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("jali_role", selectedRole);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Warm Muted Aesthetic */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-amber-800 via-orange-900 to-amber-950">
        {/* Background Image - low opacity */}
        <div className="absolute inset-0 z-0">
          <img
            src={loginBg}
            alt=""
            className="w-full h-full object-cover opacity-[0.12] mix-blend-overlay"
          />
        </div>

        {/* Decorative Jali Logo Watermark */}
        <div className="absolute -bottom-24 -right-24 z-[1] opacity-[0.06]">
          <img src={jaliLogo} alt="" className="w-[600px] h-[600px] brightness-0 invert" />
        </div>

        {/* Animated warm glows */}
        <div className="absolute inset-0 z-[2]">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-amber-600/15 blur-3xl animate-pulse" />
          <div className="absolute bottom-32 right-20 w-96 h-96 rounded-full bg-orange-700/10 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/3 w-56 h-56 rounded-full bg-yellow-700/8 blur-2xl animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Large Logo Only - REMOVED for right panel placement */}
          {/* Content */}
          <div className="space-y-8">
            <h2 className="text-4xl font-light leading-tight drop-shadow-md">
              Empowering those who
              <br />
              <span className="font-bold">empower communities</span>
            </h2>
            <p className="text-white/70 text-lg max-w-md leading-relaxed">
              Your AI-powered companion for Social workers
            </p>

            {/* Role Selection Tabs - Large 3D */}
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/50 font-semibold mb-5">I am a</p>
              <div className="flex gap-5">
                {/* CHV Tab */}
                <button
                  onClick={() => setSelectedRole("chv")}
                  className={`relative flex items-center gap-4 px-8 py-6 rounded-2xl font-bold text-base transition-all duration-250 min-w-[200px] border ${selectedRole === "chv"
                    ? "bg-white text-slate-900 border-white/80 shadow-[0_8px_0_0_rgba(100,50,0,0.3),0_4px_20px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.9)] translate-y-0 scale-[1.02]"
                    : "bg-white/10 text-white border-white/20 shadow-[0_6px_0_0_rgba(80,40,0,0.2),0_2px_10px_rgba(0,0,0,0.15)] hover:bg-white/20 hover:translate-y-[-2px] hover:shadow-[0_8px_0_0_rgba(80,40,0,0.22),0_4px_16px_rgba(0,0,0,0.2)] hover:scale-[1.01] backdrop-blur-sm"
                    } active:translate-y-[3px] active:shadow-[0_2px_0_0_rgba(100,50,0,0.3)] active:scale-[0.99]`}
                >
                  <div className="text-left">
                    <span className="block leading-tight text-lg">CHV</span>
                    <span className={`text-xs font-normal ${selectedRole === "chv" ? "text-slate-500" : "text-white/50"
                      }`}>Health Volunteer</span>
                  </div>
                  {selectedRole === "chv" && (
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white">
                      <svg width="12" height="10" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  )}
                </button>

                {/* Case Manager Tab */}
                <button
                  onClick={() => setSelectedRole("case_manager")}
                  className={`relative flex items-center gap-4 px-8 py-6 rounded-2xl font-bold text-base transition-all duration-250 min-w-[200px] border ${selectedRole === "case_manager"
                    ? "bg-white text-slate-900 border-white/80 shadow-[0_8px_0_0_rgba(100,50,0,0.3),0_4px_20px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.9)] translate-y-0 scale-[1.02]"
                    : "bg-white/10 text-white border-white/20 shadow-[0_6px_0_0_rgba(80,40,0,0.2),0_2px_10px_rgba(0,0,0,0.15)] hover:bg-white/20 hover:translate-y-[-2px] hover:shadow-[0_8px_0_0_rgba(80,40,0,0.22),0_4px_16px_rgba(0,0,0,0.2)] hover:scale-[1.01] backdrop-blur-sm"
                    } active:translate-y-[3px] active:shadow-[0_2px_0_0_rgba(100,50,0,0.3)] active:scale-[0.99]`}
                >
                  <div className="text-left">
                    <span className="block leading-tight text-lg">Case Manager</span>
                    <span className={`text-xs font-normal ${selectedRole === "case_manager" ? "text-slate-500" : "text-white/50"
                      }`}>Supervisor</span>
                  </div>
                  {selectedRole === "case_manager" && (
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white">
                      <svg width="12" height="10" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>

          <p className="text-sm text-white/30">
            © 2026 Jali.ai — Built for impact
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Logo - Visible on all screens */}
          <div className="flex justify-center mb-6">
            <a href="#">
              <img src={jaliLogo} alt="Jali.ai Logo" className="h-28 w-auto" />
            </a>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-light text-foreground">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-muted-foreground">
              {isSignUp
                ? "Join the community of social workers using AI"
                : "Sign in to continue your impact journey"}
            </p>
          </div>

          {/* Mobile Role Selection */}
          <div className="lg:hidden space-y-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">I am a</p>
            <div className="flex bg-muted/50 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedRole("chv")}
                className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all ${selectedRole === "chv"
                  ? "bg-white text-primary shadow-sm ring-1 ring-border/50"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                CHV
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole("case_manager")}
                className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all ${selectedRole === "case_manager"
                  ? "bg-white text-primary shadow-sm ring-1 ring-border/50"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Case Manager
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground/80 text-sm">
                  Full Name
                </Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  className="h-12 rounded-xl border-border/60 bg-muted/30 focus:bg-background transition-colors"
                />
              </div>
            )}

            {/* County Selection */}
            <div className="space-y-2">
              <Label className="text-foreground/80 text-sm flex items-center gap-2">
                <MapPin size={14} className="text-primary" />
                Select County
              </Label>
              <Select onValueChange={setSelectedCounty} value={selectedCounty}>
                <SelectTrigger className="h-12 rounded-xl border-border/60 bg-muted/30 focus:bg-background transition-colors">
                  <SelectValue placeholder="Select your county" />
                </SelectTrigger>
                <SelectContent>
                  {counties.map((county) => (
                    <SelectItem key={county.name} value={county.name}>
                      {county.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Constituency Selection */}
            <div className="space-y-2">
              <Label className="text-foreground/80 text-sm">
                Select Constituency
              </Label>
              <Select
                onValueChange={setSelectedConstituency}
                value={selectedConstituency}
                disabled={!selectedCounty}
              >
                <SelectTrigger className="h-12 rounded-xl border-border/60 bg-muted/30 focus:bg-background transition-colors">
                  <SelectValue placeholder={selectedCounty ? "Select constituency" : "Select county first"} />
                </SelectTrigger>
                <SelectContent>
                  {constituencies.map((constituency) => (
                    <SelectItem key={constituency.name} value={constituency.name}>
                      {constituency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/80 text-sm">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@organization.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl border-border/60 bg-muted/30 focus:bg-background transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground/80 text-sm">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl border-border/60 bg-muted/30 focus:bg-background transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {!isSignUp && (
              <div className="flex justify-end">
                <button type="button" className="text-sm text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full group">
              {isSignUp ? "Create Account" : "Sign In"}
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Toggle */}
          <p className="text-center text-sm text-muted-foreground">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary font-medium hover:underline"
            >
              {isSignUp ? "Sign in" : "Create one"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
