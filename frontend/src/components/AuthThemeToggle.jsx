import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

/**
 * Theme toggle for Login and Register pages.
 * Syncs with localStorage and document class (same logic as App).
 */
export default function AuthThemeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center bg-white/70 dark:bg-dark-700/80 backdrop-blur-xl border border-white/70 dark:border-dark-600 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-cyan-200 transition shadow-[0_12px_24px_rgba(15,23,42,0.12)]"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
