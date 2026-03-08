import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const DashboardLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-white">
        <DashboardSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="sticky top-0 z-20 flex h-12 items-center gap-4 border-b border-slate-100 bg-white px-6">
            <SidebarTrigger className="text-slate-400 hover:text-slate-600" />

            {/* Search */}
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
                <input
                  placeholder="Search..."
                  className="w-full pl-9 h-8 rounded-lg bg-slate-50 border border-slate-100 text-sm text-slate-600 placeholder:text-slate-300 focus:outline-none focus:border-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button className="relative p-1.5 rounded-lg hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-600">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-red-500" />
              </button>

              <Avatar className="h-7 w-7 border border-slate-100">
                <AvatarFallback className="bg-slate-50 text-slate-600 text-[10px] font-medium">
                  AK
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 p-6 overflow-auto bg-slate-50/50">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
