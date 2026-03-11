import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Cases from "./pages/Cases";
import Team from "./pages/Team";
import GenericPage from "./pages/GenericPage";
import JaliAssistant from "./pages/JaliAssistant";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="assistant" element={<JaliAssistant />} />
            <Route path="cases" element={<Cases />} />
            <Route path="team" element={<Team />} />
            <Route path="appointments" element={<GenericPage title="Appointments" description="Manage your ongoing schedule and patient visits." iconName="Calendar" />} />
            <Route path="community" element={<GenericPage title="Community Education" description="Access the library of helpful materials for field health workers." iconName="BookOpen" />} />
            <Route path="analytics" element={<GenericPage title="Real-Time Analytics" description="Dive deep into the metrics of your health worker cohorts." iconName="BarChart3" />} />
            <Route path="map" element={<GenericPage title="Field Map Overview" description="Live geographic tracking of your deployments." iconName="MapPin" />} />
            <Route path="broadcast" element={<GenericPage title="Emergency Broadcast" description="Push live SMS alerts to your selected workforce segments." iconName="Radio" />} />
            <Route path="messages" element={<GenericPage title="Secure Messaging" description="Encrypted communication channel with team members." iconName="MessageSquare" />} />
            <Route path="notifications" element={<GenericPage title="Notifications" description="Your centralized hub for system alerts and pings." iconName="Bell" />} />
            <Route path="agents" element={<GenericPage title="Agent Console" description="Manage the configuration of your backend AI health models." iconName="Cpu" />} />
            <Route path="approvals" element={<GenericPage title="Approvals" description="Review escalated cases and manual intervention requests." iconName="Activity" />} />
          </Route>
          <Route path="*" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
