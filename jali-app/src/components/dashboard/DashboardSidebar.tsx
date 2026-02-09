import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BrainCircuit,
  Users,
  FolderOpen,
  MapPin,
  BarChart3,
  MessageSquare,
  Settings,
  LogOut,
  Bell,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import jaliLogo from "@/assets/jali-logo.svg";

const mainNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Cases", url: "/dashboard/cases", icon: FolderOpen },
  { title: "Community", url: "/dashboard/community", icon: Users },
  { title: "Field Map", url: "/dashboard/map", icon: MapPin },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
];

const toolsNav = [
  { title: "AI Assistant", url: "/dashboard/assistant", icon: BrainCircuit },
  { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
  { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
];

export function DashboardSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/dashboard") return currentPath === "/dashboard";
    return currentPath.startsWith(path);
  };

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-5">
        <div className="flex items-center gap-3">
          <img src={jaliLogo} alt="Jali.ai" className="h-8" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">Jali.ai</span>
            <span className="text-xs text-muted-foreground">Social Worker Hub</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/60 px-3">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={isActive(item.url)}
                    onClick={() => navigate(item.url)}
                    className={`mx-2 rounded-xl transition-all duration-200 ${
                      isActive(item.url)
                        ? "bg-primary/10 text-primary font-medium shadow-sm"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                    {item.title === "Cases" && (
                      <span className="ml-auto text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                        12
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
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/60 px-3">
            Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={isActive(item.url)}
                    onClick={() => navigate(item.url)}
                    className={`mx-2 rounded-xl transition-all duration-200 ${
                      isActive(item.url)
                        ? "bg-primary/10 text-primary font-medium shadow-sm"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                    {item.title === "AI Assistant" && (
                      <span className="ml-auto flex h-2 w-2 rounded-full bg-secondary animate-pulse" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarSeparator className="mb-3" />

        {/* Settings */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => navigate("/dashboard/settings")}
              className="mx-2 rounded-xl hover:bg-muted/50"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User profile card */}
        <div className="mt-2 flex items-center gap-3 rounded-xl bg-muted/40 p-3">
          <Avatar className="h-9 w-9 border-2 border-primary/20">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              AK
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Amara Kimani</p>
            <p className="text-xs text-muted-foreground truncate">Field Coordinator</p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
