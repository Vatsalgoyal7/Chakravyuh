import { Sun, Moon } from "lucide-react";
import { useTheme } from "../lib/ThemeContext";

export default function ThemeToggle() {
  const { isWhiteBg, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={isWhiteBg ? "Switch to Dark Mode" : "Switch to Light Mode"}
      className="fixed bottom-20 right-4 z-50 w-11 h-11 rounded-full bg-gray-900/80 backdrop-blur-sm border border-white/10 text-white shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center"
    >
      {isWhiteBg
        ? <Moon className="w-5 h-5 text-indigo-300" />
        : <Sun className="w-5 h-5 text-amber-400" />
      }
    </button>
  );
}
