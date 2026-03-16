import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Activity,
  BarChart3,
  LineChart,
  Database,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { setToken } from "../services/api";

export default function Navbar({ activeTab, onTabChange, theme, toggleTheme }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
    setMobileOpen(false);
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "attendance", label: "Daily Attendance", icon: GraduationCap },
    { id: "charts", label: "Analytics", icon: BarChart3 },
    { id: "timeline", label: "Timeline", icon: LineChart },
    { id: "seeder", label: "Input Details", icon: Database },
  ];

  const navLinkClass = (id) =>
    `flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
      activeTab === id
        ? "bg-white text-sky-700 shadow-[0_8px_20px_rgba(10,132,255,0.16)] dark:bg-dark-700 dark:text-cyan-200"
        : "text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-white/60 dark:hover:bg-dark-700/80"
    }`;

  const iconBtnClass =
    "w-10 h-10 rounded-2xl flex items-center justify-center border border-white/60 dark:border-dark-600 bg-white/70 dark:bg-dark-700/70 text-slate-600 dark:text-gray-300 hover:text-sky-700 dark:hover:text-cyan-200 transition-all duration-200 shadow-[0_10px_22px_rgba(15,23,42,0.08)]";

  const greeting = useMemo(() => {
    if (!user?.name) return "Welcome back";
    return `Hi, ${user.name.split(" ")[0]}`;
  }, [user]);

  return (
    <nav className="sticky top-0 z-50 border-b border-white/60 dark:border-dark-600 bg-white/55 dark:bg-dark-900/55 backdrop-blur-2xl transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[72px] gap-4 py-3">
          {/* Left: App title */}
          <div className="flex items-center gap-3 min-w-0 shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-[0_12px_22px_rgba(10,132,255,0.35)] flex-shrink-0">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div className="hidden sm:block min-w-0">
              <h1 className="text-base font-extrabold text-slate-800 dark:text-white truncate tracking-tight">
                AttendanceOS
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-300 -mt-0.5 truncate">
                {greeting}
              </p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-sm font-extrabold text-slate-800 dark:text-white">
                AttendanceOS
              </h1>
            </div>
          </div>

          {/* Center: Desktop navigation */}
          <div className="hidden md:flex items-center gap-1 flex-1 justify-center px-2">
            <div className="flex items-center gap-1 bg-white/55 dark:bg-dark-800/85 rounded-[20px] p-1.5 border border-white/70 dark:border-dark-600 shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => onTabChange(id)}
                  className={navLinkClass(id)}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Theme + Logout + Mobile menu */}
          <div className="flex items-center gap-2 shrink-0">
            {user && (
              <span className="hidden lg:block text-xs text-slate-500 dark:text-slate-300 truncate max-w-[120px]">
                {user.name || user.email}
              </span>
            )}
            <button
              onClick={toggleTheme}
              className={iconBtnClass}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={handleLogout}
              className={`${iconBtnClass} hover:text-rose-500`}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
            <button
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-2xl border border-white/60 dark:border-dark-600 bg-white/70 dark:bg-dark-700/70 text-slate-600 dark:text-gray-300 transition-all duration-200"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-white/60 dark:border-dark-600 animate-fade-in">
            <div className="flex flex-col gap-1 pt-3">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    onTabChange(id);
                    setMobileOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                    activeTab === id
                      ? "bg-white text-sky-700 dark:bg-dark-700 dark:text-cyan-200"
                      : "text-slate-600 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-dark-700"
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-rose-500 hover:bg-rose-500/10 transition-all duration-200 mt-2"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
