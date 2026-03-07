import {
  GraduationCap,
  Activity,
  BarChart3,
  Database,
  Sun,
  Moon,
} from "lucide-react";

export default function Navbar({ activeTab, onTabChange, theme, toggleTheme }) {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "attendance", label: "Daily Attendance", icon: GraduationCap },
    { id: "charts", label: "Analytics", icon: BarChart3 },
    { id: "seeder", label: "Database Seeder", icon: Database },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-light-600 dark:border-dark-600 bg-white/80 dark:bg-dark-900/80 backdrop-blur-xl transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg glow-purple">
              <GraduationCap size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 dark:text-white tracking-tight transition-colors">
                AttendanceIQ
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-gray-500 -mt-0.5 transition-colors">
                Smart Tracker
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-light-800 dark:bg-dark-800 rounded-2xl p-1 border border-light-600 dark:border-dark-600 transition-colors duration-300">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`tab-btn flex items-center gap-2 ${activeTab === id ? "active" : "text-slate-500 hover:text-slate-800 hover:bg-light-700 dark:text-gray-400 dark:hover:text-white dark:hover:bg-dark-600"}`}
              >
                <Icon size={15} />
                <span className="hidden sm:block">{label}</span>
              </button>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Live indicator */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs text-slate-500 dark:text-gray-400 hidden sm:block transition-colors">
                Live
              </span>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-light-800 dark:bg-dark-800 border border-light-600 dark:border-dark-600 text-slate-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:bg-light-700 dark:hover:bg-dark-700 transition-all duration-300 group"
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
            >
              {theme === "dark" ? (
                <Sun
                  size={18}
                  className="group-hover:rotate-45 transition-transform duration-500"
                />
              ) : (
                <Moon
                  size={18}
                  className="group-hover:-rotate-12 transition-transform duration-500"
                />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
