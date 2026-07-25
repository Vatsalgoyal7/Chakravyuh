import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../lib/ThemeContext";

export default function ThemeToggle() {
  const { isWhiteBg, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isWhiteBg ? "Switch to dark mode" : "Switch to light mode"}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-11 h-11 rounded-full bg-[#0a0d14]/85 backdrop-blur-xl border border-white/10 text-gray-300 hover:text-white hover:border-[var(--theme-accent-border)] shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all cursor-pointer"
    >
      {isWhiteBg ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-[var(--theme-accent)]" />}
    </button>
  );
}
