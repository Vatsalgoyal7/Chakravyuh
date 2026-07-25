import React, { useState } from "react";
import { Menu, X, Trophy } from "lucide-react";
import { useTheme } from "../lib/ThemeContext";

interface PublicNavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function PublicNavbar({ activeTab, setActiveTab }: PublicNavbarProps) {
  const { isWhiteBg } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

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
                IMSEC Engineering College, Ghaziabad
              </span>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1.5">
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
            
          </div>

          {/* Mobile hamburger menu toggle */}
          <div className="flex md:hidden items-center">
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
