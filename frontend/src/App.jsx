import { useState, useEffect, useCallback } from "react";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import DailyAttendance from "./components/DailyAttendance";
import PredictionPanel from "./components/PredictionPanel";
import ProjectionPanel from "./components/ProjectionPanel";
import AttendanceCharts from "./components/AttendanceCharts";
import AttendanceTimeline from "./components/AttendanceTimeline";
import DatabaseSeeder from "./components/DatabaseSeeder";
import { fetchAttendance, fetchAttendanceTimeline } from "./services/api";
import { Loader, AlertTriangle } from "lucide-react";
import useAttendanceReminder from "./hooks/useAttendanceReminder";

export default function App() {
  useAttendanceReminder();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState(null);

  // Theme State
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  // Apply theme class to document
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAttendance();
      setAttendanceData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const loadTimeline = useCallback(async () => {
    setTimelineLoading(true);
    setTimelineError(null);
    try {
      const data = await fetchAttendanceTimeline();
      setTimelineData(data);
    } catch (err) {
      setTimelineError(err.message);
    } finally {
      setTimelineLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "timeline") {
      loadTimeline();
    }
  }, [activeTab, loadTimeline]);

  return (
    <div className="min-h-screen bg-light-900 dark:bg-dark-900 transition-colors duration-300">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: theme === "dark" ? "#1a1a27" : "#ffffff",
            color: theme === "dark" ? "#e5e7eb" : "#1e293b",
            border:
              theme === "dark" ? "1px solid #2d2d4a" : "1px solid #e2e8f0",
            borderRadius: "12px",
            fontSize: "13px",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: theme === "dark" ? "#0a0a0f" : "#ffffff",
            },
          },
          error: {
            iconTheme: {
              primary: "#f43f5e",
              secondary: theme === "dark" ? "#0a0a0f" : "#ffffff",
            },
          },
        }}
      />

      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors duration-300">
            {activeTab === "dashboard" && (
              <span>
                Dashboard <span className="text-gradient-purple">Overview</span>
              </span>
            )}
            {activeTab === "attendance" && (
              <span>
                Daily <span className="text-gradient-cyan">Attendance</span>
              </span>
            )}
            {activeTab === "charts" && (
              <span>
                Attendance{" "}
                <span className="text-gradient-purple">Analytics</span>
              </span>
            )}
            {activeTab === "timeline" && (
              <span>
                Attendance <span className="text-gradient-cyan">Timeline</span>
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeTab === "dashboard" &&
              "Track your attendance, predictions, and projections"}
            {activeTab === "attendance" &&
              "Mark today's attendance and update your records"}
            {activeTab === "charts" &&
              "Visual insights into your attendance patterns"}
            {activeTab === "timeline" &&
              "Subject-wise attendance percentage from day 1 to today"}
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="glass-card p-12 flex flex-col items-center justify-center gap-4">
            <Loader size={28} className="animate-spin text-indigo-400" />
            <p className="text-gray-400">Loading attendance data...</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="glass-card p-6 border border-rose-500/30">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle size={18} className="text-rose-400" />
              <h3 className="font-semibold text-white">Could not load data</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">{error}</p>
            <p className="text-xs text-gray-500 mb-3">
              Make sure the backend is running on port 5000 and MongoDB is
              connected. Then run:
              <br />
              <code className="text-indigo-400 font-mono">
                cd backend && node seed.js
              </code>
            </p>
            <button onClick={loadAttendance} className="btn-primary text-sm">
              Retry
            </button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && attendanceData && (
          <>
            {activeTab === "dashboard" && (
              <div className="space-y-8">
                <Dashboard
                  data={attendanceData}
                  onRefresh={loadAttendance}
                  loading={loading}
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      75% Prediction
                    </h2>
                    <PredictionPanel />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      Semester Projection
                    </h2>
                    <ProjectionPanel />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "attendance" && (
              <DailyAttendance
                subjects={attendanceData.subjects}
                onUpdate={loadAttendance}
              />
            )}

            {activeTab === "charts" && (
              <AttendanceCharts subjects={attendanceData.subjects} />
            )}

            {activeTab === "timeline" && (
              <AttendanceTimeline
                data={timelineData}
                loading={timelineLoading}
                error={timelineError}
                onRetry={loadTimeline}
              />
            )}

            {activeTab === "seeder" && (
              <DatabaseSeeder onUpdate={loadAttendance} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
