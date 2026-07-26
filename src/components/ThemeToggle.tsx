import { useTheme } from "../lib/ThemeContext";

export default function ThemeToggle() {
  const { isWhiteBg, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-20 right-4 z-50 px-4 py-2 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition"
    >
      {isWhiteBg ? "Dark Mode" : "Light Mode"}
    </button>
  );
}
