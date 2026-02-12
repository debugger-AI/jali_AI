import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { ArrowRight, Eye, EyeOff, Sparkles, MapPin } from "lucide-react";
import jaliLogo from "@/assets/jali-logo.svg";
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
    // Mock login - navigate to dashboard
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-secondary">
        {/* Animated organic shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/20 blur-3xl animate-pulse" />
          <div className="absolute bottom-32 right-20 w-96 h-96 rounded-full bg-accent/15 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/3 w-56 h-56 rounded-full bg-primary/10 blur-2xl animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-secondary-foreground">
          <div>
            <Link to="/">
              <img src={jaliLogo} alt="Jali.ai Logo" className="h-28 w-auto brightness-0 invert" />
            </Link>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-light leading-tight">
              Empowering those who
              <br />
              <span className="font-semibold">empower communities</span>
            </h2>
            <p className="text-secondary-foreground/80 text-lg max-w-md leading-relaxed">
              Your AI-powered companion for case management, community insights, and impactful healthcare delivery.
            </p>

            {/* Floating stats */}
            <div className="flex gap-6 mt-8">
              {[
                { value: "12K+", label: "Cases managed" },
                { value: "98%", label: "Accuracy rate" },
                { value: "45", label: "Communities" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-secondary-foreground/10 backdrop-blur-sm rounded-2xl p-4 border border-secondary-foreground/10"
                >
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-secondary-foreground/70">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-secondary-foreground/50">
            © 2026 Jali.ai — Built for impact
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <Link to="/">
              <img src={jaliLogo} alt="Jali.ai Logo" className="h-28 w-auto" />
            </Link>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles size={20} />
              <span className="text-sm font-medium">AI-Powered Platform</span>
            </div>
            <h1 className="text-3xl font-light text-foreground">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-muted-foreground">
              {isSignUp
                ? "Join the community of social workers using AI"
                : "Sign in to continue your impact journey"}
            </p>
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
