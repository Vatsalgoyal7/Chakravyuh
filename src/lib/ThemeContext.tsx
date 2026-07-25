import React, { createContext, useContext, useState, useEffect } from "react";

export type Theme = "inferno" | "cyber" | "royal" | "emerald" | "crimson";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isWhiteBg: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themeColors: Record<Theme, string> = {
  inferno: "#f97316",
  cyber: "#06b6d4",
  royal: "#a855f7",
  emerald: "#10b981",
  crimson: "#f43f5e",
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isWhiteBg, setIsWhiteBg] = useState(() => {
    try {
      return localStorage.getItem("chakravyuh_light_mode") === "true";
    } catch {
      return false;
    }
  });

  const toggleTheme = () => {
    setIsWhiteBg((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("chakravyuh_light_mode", String(next));
      } catch (e) {
        console.error("Failed to write light mode preference to localStorage", e);
      }
      return next;
    });
  };

  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem("chakravyuh_theme") as Theme;
      if (
        saved === "inferno" ||
        saved === "cyber" ||
        saved === "royal" ||
        saved === "emerald" ||
        saved === "crimson"
      ) {
        return saved;
      }
    } catch (e) {
      console.error("Failed to read theme from localStorage", e);
    }
    return "inferno";
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("chakravyuh_theme", newTheme);
    } catch (e) {
      console.error("Failed to write theme to localStorage", e);
    }
  };

  useEffect(() => {
    // Update document dataset for CSS selection
    document.documentElement.dataset.theme = theme;

    // Update meta theme-color tag for mobile status bar matches
    const metaTag = document.getElementById("theme-color-meta") || document.querySelector('meta[name="theme-color"]');
    if (metaTag) {
      metaTag.setAttribute("content", themeColors[theme]);
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.themeMode = isWhiteBg ? "light" : "dark";
    if (isWhiteBg) {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  }, [isWhiteBg]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isWhiteBg, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
