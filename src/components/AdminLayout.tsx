import React, { useState } from "react";
import { 
  Trophy, 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  Image as ImageIcon, 
  Megaphone, 
  BookOpen, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck, 
  User, 
  WifiOff, 
  Database,
  PhoneCall,
  Eye,
  QrCode
} from "lucide-react";
import { AdminUser } from "../types";
import { isFirebaseConfigured } from "../lib/firebase";

interface AdminLayoutProps {
  user: AdminUser;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
  onGoToPublic?: () => void;
}

export default function AdminLayout({ 
  user, 
  onLogout, 
  activeTab, 
  setActiveTab, 
  children,
  onGoToPublic
}: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["super_admin", "coordinator"] },
    { id: "events", label: "Events Manager", icon: Trophy, roles: ["super_admin"] },
    { id: "registrations", label: "Registrations Control", icon: Users, roles: ["super_admin", "coordinator"] },
    { id: "schedules", label: "Match Schedules", icon: CalendarDays, roles: ["super_admin", "coordinator"] },
    { id: "notifications", label: "Announcements", icon: Megaphone, roles: ["super_admin", "coordinator"] },
    { id: "gallery", label: "Gallery Upload", icon: ImageIcon, roles: ["super_admin"] },
    { id: "about", label: "About Section", icon: User, roles: ["super_admin"] },
    { id: "rules_contacts", label: "Rules & Directory", icon: BookOpen, roles: ["super_admin"] },
    { id: "payment_settings", label: "Payment Settings", icon: QrCode, roles: ["super_admin"] },
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(user.role));

  const getRoleBadgeColor = () => {
    return user.role === "super_admin" 
      ? "bg-red-500/10 border-red-500/30 text-red-400" 
      : "bg-amber-500/10 border-amber-500/30 text-amber-400";
  };

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-gray-100 font-sans flex flex-col">
      
      {/* Resilient Database System Indicator Banner */}
      {!isFirebaseConfigured && (
        <div className="bg-gradient-to-r from-amber-600/90 to-orange-700/90 text-white text-[11px] px-4 py-2 font-mono flex items-center justify-between shadow-md relative z-50">
          <div className="flex items-center gap-2">
            <WifiOff className="w-3.5 h-3.5 animate-bounce" />
            <span>
              <strong>Chakravyuh Offline Sandbox Sandbox:</strong> Running on simulated lightning-fast LocalStorage container. All registration forms, status changes, and events will persist locally.
            </span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 opacity-90">
            <Database className="w-3.5 h-3.5" />
            <span>Schema: chakravyuh_2k26_v1.0</span>
          </div>
        </div>
      )}

      {/* Top Main Navigation Header */}
      <header className="bg-[#12141a] border-b border-gray-800/80 px-4 py-3 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-1.5 hover:bg-gray-800 rounded-lg lg:hidden transition-all text-gray-400 hover:text-white"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black font-mono tracking-wider text-white">
                CHAKRAVYUH <span className="text-orange-500">2K26</span>
              </h1>
              <p className="text-[10px] text-gray-500 font-mono hidden sm:block">
                IMSEC Engineering College Sports Admin
              </p>
            </div>
          </div>
        </div>

        {/* User profile dropdown and metadata */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">{user.displayName}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getRoleBadgeColor()}`}>
                {user.role === "super_admin" ? "SUPER ADMIN" : `COORDINATOR`}
              </span>
              {user.role === "coordinator" && (
                <span className="text-[9px] text-gray-500 font-mono">
                  ({user.assignedSports.join(", ")})
                </span>
              )}
            </div>
          </div>

          <div className="w-9 h-9 bg-orange-600/10 border border-orange-500/20 rounded-full flex items-center justify-center text-orange-400 font-bold text-sm shadow-inner shadow-orange-500/5">
            {user.displayName.charAt(0).toUpperCase()}
          </div>

          {onGoToPublic && (
            <button
              onClick={onGoToPublic}
              title="Return to Public Website"
              className="px-3 py-1.5 bg-gray-800/40 hover:bg-orange-500/10 border border-gray-800 hover:border-orange-500/20 text-gray-400 hover:text-orange-400 rounded-xl transition-all font-mono text-[10px] sm:text-xs flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-orange-500" />
              <span className="hidden sm:inline font-bold">Public Portal</span>
            </button>
          )}

          <button 
            onClick={onLogout}
            title="Exit Portal"
            className="p-2 bg-gray-800/40 hover:bg-red-500/10 border border-gray-800 hover:border-red-500/20 text-gray-400 hover:text-red-400 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Structural Body */}
      <div className="flex flex-1 relative">
        
        {/* Navigation Sidebar Drawer */}
        <aside 
          className={`
            fixed inset-y-0 left-0 z-30 w-64 bg-[#12141a] border-r border-gray-800/80 pt-16 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:pt-0 lg:z-0
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div className="p-4 flex flex-col h-full justify-between">
            <div className="space-y-1.5">
              <div className="px-3 mb-4">
                <span className="text-[10px] font-mono tracking-wider font-bold text-gray-600 uppercase">
                  Management Controls
                </span>
              </div>
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all outline-none
                      ${isActive 
                        ? "bg-gradient-to-r from-orange-500/15 to-amber-500/5 border-l-4 border-orange-500 text-orange-500 shadow-md shadow-orange-500/[0.02]" 
                        : "text-gray-400 hover:bg-gray-800/30 hover:text-gray-200 border-l-4 border-transparent"
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-orange-500" : "text-gray-500"}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sidebar Branding footer */}
            <div className="bg-[#161a23] border border-gray-800/60 rounded-xl p-3 mt-6">
              <div className="flex items-center gap-2 mb-1.5">
                <ShieldCheck className="w-4 h-4 text-orange-500" />
                <span className="text-[10px] font-bold text-gray-300 font-mono">CHAKRAVYUH SECURITY</span>
              </div>
              <p className="text-[9px] text-gray-500 leading-normal">
                Logged session encrypted with standard token filters. Please sign out after administrative tasks.
              </p>
            </div>
          </div>
        </aside>

        {/* Sidebar Overlay for Mobile views */}
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          ></div>
        )}

        {/* Primary Page Content Wrapper */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
