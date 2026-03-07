import { useState } from "react";
import {
  GraduationCap,
  Activity,
  BarChart3,
  Database,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";

export default function Navbar({ activeTab, onTabChange, theme, toggleTheme }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "attendance", label: "Daily Attendance", icon: GraduationCap },
    { id: "charts", label: "Analytics", icon: BarChart3 },
    { id: "seeder", label: "Database Seeder", icon: Database },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-light-600 dark:border-dark-600 bg-white/80 dark:bg-dark-900/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Navbar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <GraduationCap size={18} className="text-white" />
            </div>

            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-slate-800 dark:text-white">
                AttendanceIQ
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-gray-500 -mt-0.5">
                Smart Tracker
              </p>
            </div>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden md:flex items-center gap-1 bg-light-800 dark:bg-dark-800 rounded-2xl p-1 border border-light-600 dark:border-dark-600">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition ${
                  activeTab === id
                    ? "bg-indigo-500 text-white"
                    : "text-slate-500 hover:text-slate-800 hover:bg-light-700 dark:text-gray-400 dark:hover:text-white dark:hover:bg-dark-600"
                }`}
              >
                <Icon size={15} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-light-800 dark:bg-dark-800 border border-light-600 dark:border-dark-600 text-slate-600 dark:text-gray-400 hover:text-indigo-600"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col gap-2 mt-3">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    onTabChange(id);
                    setMobileOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
                    activeTab === id
                      ? "bg-indigo-500 text-white"
                      : "text-slate-600 dark:text-gray-300 hover:bg-light-700 dark:hover:bg-dark-700"
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
