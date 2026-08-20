import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

const KEY = "threadline_theme";

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem(KEY) || "light"
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      document.documentElement.dataset.theme =
        theme === "system"
          ? (media.matches ? "dark" : "light")
          : theme;
    };

    apply();
    media.addEventListener("change", apply);
    localStorage.setItem(KEY, theme);

    return () => media.removeEventListener("change", apply);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);