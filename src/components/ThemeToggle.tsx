import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../lib/ThemeContext";

export default function ThemeToggle() {
  const { isWhiteBg, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`fixed top-24 right-4 z-50 p-3 rounded-full backdrop-blur-sm border transition-all hover:scale-110 group ${isWhiteBg ? 'bg-white/80 border-gray-300' : 'bg-gray-900/80 border-white/10'}`}
      title={isWhiteBg ? "Switch to Dark Mode" : "Switch to Light Mode"}
    >
      {isWhiteBg ? (
        <Moon className="w-5 h-5 text-gray-600 group-hover:text-[var(--theme-accent)] transition-colors" />
      ) : (
        <Sun className="w-5 h-5 text-gray-300 group-hover:text-[var(--theme-accent)] transition-colors" />
      )}
    </button>
  );
}
