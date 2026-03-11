import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  MapPin,
  BarChart3,
  MessageSquare,
  Settings,
  LogOut,
  Bell,
  Cpu,
  Calendar,
  BookOpen,
  Activity,
  Radio
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import jaliLogo from "@/assets/jali-logo.svg";

const chvNav = [
  { title: "Home", url: "/dashboard", icon: LayoutDashboard },
  { title: "My Cases", url: "/dashboard/cases", icon: null, badge: "12" },
  { title: "Appointments", url: "/dashboard/appointments", icon: null },
  { title: "Education", url: "/dashboard/community", icon: null },
  { title: "AI Assistant", url: "/dashboard/assistant", icon: null },
];

const chvTools = [
  { title: "Messages", url: "/dashboard/messages", icon: null },
  { title: "Notifications", url: "/dashboard/notifications", icon: null },
];

const managerNav = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Field Team", url: "/dashboard/team", icon: null },
  { title: "Analytics", url: "/dashboard/analytics", icon: null },
  { title: "Field Map", url: "/dashboard/map", icon: null },
  { title: "Broadcast", url: "/dashboard/broadcast", icon: null },
  { title: "AI Assistant", url: "/dashboard/assistant", icon: null },
];

const managerTools = [
  { title: "Agents", url: "/dashboard/agents", icon: null },
  { title: "Approvals", url: "/dashboard/approvals", icon: null, badge: "5" },
  { title: "Notifications", url: "/dashboard/notifications", icon: null },
];

export function DashboardSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const role = localStorage.getItem("jali_role") || "chv";
  const mainNav = role === "case_manager" ? managerNav : chvNav;
  const toolsNav = role === "case_manager" ? managerTools : chvTools;
  const roleLabel = role === "case_manager" ? "Case Manager" : "Community Health Volunteer";

  const isActive = (path: string) => {
    if (path === "/dashboard") return currentPath === "/dashboard";
    return currentPath.startsWith(path);
  };

  return (
    <Sidebar className="border-r border-slate-100">
      <SidebarHeader className="p-5">
        <div className="flex items-center gap-2.5">
          <img src={jaliLogo} alt="Jali.ai" className="h-7 w-7" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-800">Jali.ai</span>
            <span className="text-[10px] text-slate-400">Social Worker Hub</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-slate-300 px-3 font-medium">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={isActive(item.url)}
                    onClick={() => navigate(item.url)}
                    className={`mx-2 rounded-lg text-sm transition-colors ${isActive(item.url)
                      ? "bg-slate-100 text-slate-900 font-medium"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                      }`}
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    <span>{item.title}</span>
                    {item.badge && (
                      <span className="ml-auto text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {item.badge}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-slate-300 px-3 font-medium">
            Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={isActive(item.url)}
                    onClick={() => navigate(item.url)}
                    className={`mx-2 rounded-lg text-sm transition-colors ${isActive(item.url)
                      ? "bg-slate-100 text-slate-900 font-medium"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                      }`}
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarSeparator className="mb-3" />

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => navigate("/dashboard/settings")}
              className="mx-2 rounded-lg text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="mt-2 flex items-center gap-3 rounded-lg bg-slate-50 p-3">
          <Avatar className="h-8 w-8 border border-slate-100">
            <AvatarFallback className="bg-white text-slate-600 text-xs font-medium">
              AK
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">Amara Kimani</p>
            <p className="text-[10px] text-slate-400 truncate">{roleLabel}</p>
          </div>
          <button onClick={() => navigate("/")} className="text-slate-300 hover:text-red-500 transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
