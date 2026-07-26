import React, { useState, useEffect, useRef } from "react";
import { Menu, X, Trophy, Bell, Info, ShieldAlert, AlertTriangle } from "lucide-react";
import { useTheme } from "../lib/ThemeContext";
import { dbService } from "../lib/dbService";
import { Announcement } from "../types";
import { db, isFirebaseConfigured } from "../lib/firebase";
import { onSnapshot, collection } from "firebase/firestore";

interface PublicNavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function PublicNavbar({ activeTab, setActiveTab }: PublicNavbarProps) {
  const { isWhiteBg } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    dbService.getAnnouncements().then(notices => {
      const activeNotices = notices.filter(n => n.isActive);
      setAnnouncements(activeNotices);
      const lastSeen = localStorage.getItem("chakravyuh_last_seen_announcement_time");
      if (activeNotices.length > 0) {
        if (!lastSeen) {
          setHasUnread(true);
        } else {
          const hasNew = activeNotices.some(n => n.createdAt > lastSeen);
          setHasUnread(hasNew);
        }
      }
    }).catch(console.error);

    if (isFirebaseConfigured && db) {
      try {
        const unsubscribe = onSnapshot(collection(db, "notifications"), (snapshot) => {
          const notices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
          const activeNotices = notices.filter(n => n.isActive);
          setAnnouncements(activeNotices);
          
          const lastSeen = localStorage.getItem("chakravyuh_last_seen_announcement_time");
          if (activeNotices.length > 0) {
            if (!lastSeen) {
              setHasUnread(true);
            } else {
              const hasNew = activeNotices.some(n => n.createdAt > lastSeen);
              setHasUnread(hasNew);
            }
          } else {
            setHasUnread(false);
          }
        }, (err) => {
          console.error("Firestore announcements listener failed:", err);
        });
        return () => unsubscribe();
      } catch (err) {
        console.error("Failed to set up real-time listener:", err);
      }
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
    setHasUnread(false);
    localStorage.setItem("chakravyuh_last_seen_announcement_time", new Date().toISOString());
  };

  const renderDropdownPanel = (isMobile: boolean = false) => (
    <div 
      className={`absolute ${isMobile ? 'right-[-45px] sm:right-0 w-76' : 'right-0 w-80'} mt-2.5 rounded-2xl border shadow-2xl p-4 z-50 backdrop-blur-2xl transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
        isWhiteBg
          ? "bg-white/95 border-gray-200 text-gray-800 shadow-gray-200"
          : "bg-[#0b0e14]/95 border-slate-700/60 text-gray-100 shadow-black"
      }`}
    >
      <div className="flex items-center justify-between border-b border-gray-800/10 dark:border-white/5 pb-2.5 mb-3">
        <span className="text-xs font-bold font-mono tracking-wider uppercase text-orange-500">Live Broadcasts</span>
        <span className="text-[10px] font-mono text-gray-500">{announcements.length} Active</span>
      </div>
      
      <div className={`max-h-64 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin`}>
        {announcements.length === 0 ? (
          <div className="text-center py-6">
            <Bell className="w-8 h-8 text-gray-600 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-mono text-gray-500">No active announcements</p>
            <p className="text-[10px] text-gray-650 font-mono mt-0.5">You're all caught up!</p>
          </div>
        ) : (
          announcements.map((ann) => {
            const Icon = ann.type === "urgent" ? ShieldAlert : ann.type === "alert" ? AlertTriangle : Info;
            const typeColor = 
              ann.type === "urgent" 
                ? "text-red-500 bg-red-500/10 border-red-500/20" 
                : ann.type === "alert" 
                  ? "text-amber-500 bg-amber-500/10 border-amber-500/20" 
                  : "text-blue-500 bg-blue-500/10 border-blue-500/20";
            
            return (
              <div 
                key={ann.id} 
                className={`p-3 rounded-xl border transition-all ${
                  isWhiteBg
                    ? "bg-gray-50 border-gray-100 hover:border-gray-200"
                    : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex gap-2 items-start">
                  <span className={`p-1 rounded-lg border shrink-0 ${typeColor}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <p className="text-xs font-bold leading-snug break-words">{ann.title}</p>
                    <p className={`text-[10px] leading-relaxed break-words ${isWhiteBg ? "text-gray-600" : "text-gray-400"}`}>
                      {ann.message}
                    </p>
                    <span className="block text-[8px] text-gray-500 font-mono pt-1">
                      {new Date(ann.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const menuItems = [
    { id: "home", label: "Home" },
    { id: "about", label: "About" },
    { id: "events", label: "Events" },
    { id: "schedule", label: "Schedule" },
    { id: "registration", label: "Register" },
    { id: "track", label: "Track Status" },
    { id: "gallery", label: "Gallery" },
    { id: "rules", label: "Rules & Contacts" },
    { id: "faq", label: "FAQs" }
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsOpen(false);
  };

  return (
    <nav className={`sticky top-0 z-50 backdrop-blur-xl border-b shadow-[0_8px_30px_rgba(0,0,0,0.2)] transition-colors ${
      isWhiteBg
        ? "bg-white/90 border-gray-200"
        : "bg-[#080b11]/85 border-slate-700/60"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavClick("home")}>
            <div 
              className="p-1.5 rounded-lg text-[#080b11] transition-all"
              style={{
                backgroundImage: "linear-gradient(to bottom right, var(--theme-accent-gradient-from), var(--theme-accent-gradient-via), var(--theme-accent-gradient-to))",
                boxShadow: "0 4px 12px rgba(var(--theme-accent-rgb), 0.3)"
              }}
            >
              <Trophy className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className={`text-sm tracking-[0.2em] font-extrabold uppercase font-mono ${isWhiteBg ? "text-gray-900" : "text-white"}`}>
                CHAKRAVYUH <span className="font-bold" style={{ color: "var(--theme-accent)" }}>2K26</span>
              </span>
              <span className="block text-[8px] text-gray-500 tracking-wider font-mono uppercase">
                IMS Engineering College, Ghaziabad
              </span>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1.5 relative">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono tracking-wide transition-all ${
                    isActive
                      ? "text-[var(--theme-accent-text)] border border-[var(--theme-accent-border)] bg-[var(--theme-accent-bg)] shadow-[0_0_18px_var(--theme-glow)]"
                      : isWhiteBg
                        ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-transparent"
                        : "text-gray-400 hover:text-white hover:bg-slate-800/70 border border-transparent"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            
            {/* Bell Button (Desktop) */}
            <div className="relative ml-2" ref={dropdownRef}>
              <button
                onClick={handleBellClick}
                className={`p-2 rounded-xl transition-all border relative flex items-center justify-center outline-none ${
                  isDropdownOpen
                    ? "text-[var(--theme-accent-text)] border-[var(--theme-accent-border)] bg-[var(--theme-accent-bg)] shadow-[0_0_12px_var(--theme-glow)]"
                    : isWhiteBg
                      ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-gray-200"
                      : "text-gray-400 hover:text-white hover:bg-slate-800/70 border-slate-700/60"
                }`}
                title="Notifications"
              >
                <Bell className={`w-4 h-4 ${hasUnread ? "animate-pulse" : ""}`} />
                {hasUnread && announcements.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] text-white font-mono font-bold items-center justify-center">
                      {announcements.length}
                    </span>
                  </span>
                )}
              </button>
              
              {isDropdownOpen && renderDropdownPanel(false)}
            </div>
          </div>

          {/* Mobile hamburger menu toggle */}
          <div className="flex md:hidden items-center gap-2">
            
            {/* Bell Button (Mobile) */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleBellClick}
                className={`p-2 rounded-xl transition-all border relative flex items-center justify-center outline-none ${
                  isDropdownOpen
                    ? "text-[var(--theme-accent-text)] border-[var(--theme-accent-border)] bg-[var(--theme-accent-bg)] shadow-[0_0_10px_var(--theme-glow)]"
                    : isWhiteBg
                      ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-gray-200"
                      : "text-gray-400 hover:text-white hover:bg-slate-800/70 border-slate-700/60"
                }`}
              >
                <Bell className="w-4 h-4" />
                {hasUnread && announcements.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 text-[8px] text-white font-mono font-bold items-center justify-center">
                      {announcements.length}
                    </span>
                  </span>
                )}
              </button>
              
              {isDropdownOpen && renderDropdownPanel(true)}
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-1.5 rounded-lg border ${isWhiteBg ? "bg-gray-100 text-gray-600 hover:text-gray-900 border-gray-200" : "bg-gray-800/40 text-gray-400 hover:text-white border-gray-800"}`}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className={`md:hidden border-b p-4 space-y-2 font-mono ${isWhiteBg ? "border-gray-200 bg-white/98" : "border-gray-800 bg-[#0d0f12]/98"}`}>
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? "bg-[var(--theme-accent-bg)] text-[var(--theme-accent-text)] border border-[var(--theme-accent-border)]"
                    : isWhiteBg
                      ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-transparent"
                      : "text-gray-400 hover:text-white hover:bg-gray-800/40 border border-transparent"
                }`}
              >
                {item.label}
              </button>
            );
          })}
          
        </div>
      )}
    </nav>
  );
}
