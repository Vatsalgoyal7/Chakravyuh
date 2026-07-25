import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Palette, Flame, Cpu, Trophy, Zap, Activity } from "lucide-react";
import { useTheme, Theme } from "../lib/ThemeContext";

const themes = [
  {
    id: "inferno" as Theme,
    name: "Inferno",
    vibe: "Fiery sports energy (Default)",
    Icon: Flame,
    colors: "from-[#f97316] via-[#f59e0b] to-[#facc15]",
    accentColor: "#f97316",
  },
  {
    id: "cyber" as Theme,
    name: "Cyber Neon",
    vibe: "Futuristic tech arena",
    Icon: Cpu,
    colors: "from-[#06b6d4] via-[#0ea5e9] to-[#3b82f6]",
    accentColor: "#06b6d4",
  },
  {
    id: "royal" as Theme,
    name: "Royal Gold",
    vibe: "Championship royalty",
    Icon: Trophy,
    colors: "from-[#a855f7] via-[#d946ef] to-[#fbbf24]",
    accentColor: "#a855f7",
  },
  {
    id: "emerald" as Theme,
    name: "Emerald Rush",
    vibe: "Green energy velocity",
    Icon: Zap,
    colors: "from-[#10b981] via-[#14b8a6] to-[#06b6d4]",
    accentColor: "#10b981",
  },
  {
    id: "crimson" as Theme,
    name: "Crimson Storm",
    vibe: "Blood-red competitive edge",
    Icon: Activity,
    colors: "from-[#f43f5e] via-[#e11d48] to-[#ea580c]",
    accentColor: "#f43f5e",
  },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside the switcher container
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const activeThemeInfo = themes.find((t) => t.id === theme) || themes[0];

  return (
    <div ref={containerRef} className="fixed bottom-6 left-6 z-50 font-mono">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute bottom-16 left-0 w-72 bg-[#0a0d14]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_20px_var(--theme-glow)] overflow-hidden"
          >
            {/* Ambient Background Glow inside panel */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-2 mb-3.5 pb-2.5 border-b border-white/5">
              <Palette className="w-4 h-4 text-[var(--theme-accent)]" />
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                Select Arena Theme
              </span>
            </div>

            <div className="space-y-2 relative z-10">
              {themes.map((t) => {
                const isActive = t.id === theme;
                const ThemeIcon = t.Icon;

                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left flex items-center gap-3 p-2.5 rounded-xl transition-all border group cursor-pointer ${
                      isActive
                        ? "bg-white/[0.04] border-[var(--theme-accent-border)] shadow-[inset_0_1px_rgba(255,255,255,0.05),0_0_12px_var(--theme-glow)]"
                        : "bg-transparent border-transparent hover:bg-white/[0.02] hover:border-white/5"
                    }`}
                  >
                    {/* Color Circle Preview */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.colors} flex items-center justify-center text-[#090b0f] shadow-md`}
                      >
                        <ThemeIcon className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      {isActive && (
                        <div
                          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-[#0d0f12]"
                          style={{ backgroundColor: t.accentColor }}
                        />
                      )}
                    </div>

                    {/* Meta Description */}
                    <div className="flex-1 min-w-0">
                      <span
                        className={`block text-xs font-bold transition-all ${
                          isActive ? "text-white" : "text-gray-300 group-hover:text-white"
                        }`}
                      >
                        {t.name}
                      </span>
                      <span className="block text-[8px] text-gray-500 uppercase tracking-wide truncate">
                        {t.vibe}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2.5 bg-[#0a0d14]/85 backdrop-blur-xl border border-white/10 rounded-full hover:border-[var(--theme-accent-border)] text-gray-300 hover:text-white shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_10px_rgba(var(--theme-accent-rgb),0.1)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_20px_var(--theme-glow)] group transition-all cursor-pointer select-none"
      >
        <div className="relative flex items-center justify-center">
          <Palette className="w-4 h-4 text-[var(--theme-accent)] group-hover:rotate-45 transition-transform duration-500" />
        </div>
        <span className="text-[10px] font-bold tracking-wider uppercase hidden sm:inline">
          {activeThemeInfo.name}
        </span>
      </button>
    </div>
  );
}
