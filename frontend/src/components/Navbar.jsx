import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Activity,
  BarChart3,
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
    { id: "seeder", label: "Input Details", icon: Database },
  ];

  const navLinkClass = (id) =>
    `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      activeTab === id
        ? "bg-indigo-500 text-white shadow-md"
        : "text-slate-600 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white hover:bg-light-600 dark:hover:bg-dark-600"
    }`;

  const iconBtnClass =
    "w-10 h-10 rounded-xl flex items-center justify-center border border-light-600 dark:border-dark-600 bg-white/50 dark:bg-dark-800/50 hover:bg-light-600 dark:hover:bg-dark-600 text-slate-600 dark:text-gray-400 transition-all duration-200";

  return (
    <nav className="sticky top-0 z-50 border-b border-light-600 dark:border-dark-600 bg-white/90 dark:bg-dark-900/90 backdrop-blur-xl shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: App title */}
          <div className="flex items-center gap-3 min-w-0 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div className="hidden sm:block min-w-0">
              <h1 className="text-base font-bold text-slate-800 dark:text-white truncate">
                Attendance Tracker
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-gray-500 -mt-0.5 truncate">
                Smart attendance management
              </p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-sm font-bold text-slate-800 dark:text-white">
                Attendance
              </h1>
            </div>
          </div>

          {/* Center: Desktop navigation */}
          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            <div className="flex items-center gap-1 bg-light-700 dark:bg-dark-800 rounded-2xl p-1 border border-light-600 dark:border-dark-600">
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
              <span className="hidden lg:block text-xs text-slate-500 dark:text-gray-400 truncate max-w-[100px]">
                {user.name || user.email}
              </span>
            )}
            <button
              onClick={toggleTheme}
              className={`${iconBtnClass} hover:text-indigo-600 dark:hover:text-indigo-400`}
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
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl border border-light-600 dark:border-dark-600 bg-white/50 dark:bg-dark-800/50 hover:bg-light-600 dark:hover:bg-dark-600 text-slate-600 dark:text-gray-400 transition-all duration-200"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-light-600 dark:border-dark-600 animate-fade-in">
            <div className="flex flex-col gap-1 pt-3">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    onTabChange(id);
                    setMobileOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === id
                      ? "bg-indigo-500 text-white"
                      : "text-slate-600 dark:text-gray-300 hover:bg-light-600 dark:hover:bg-dark-700"
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-500/10 transition-all duration-200 mt-2"
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
