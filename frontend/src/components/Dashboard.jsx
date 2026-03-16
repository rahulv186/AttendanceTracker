import SubjectCard from "./SubjectCard";
import RiskIndicator from "./RiskIndicator";
import { TrendingUp, Users, BookOpen, Shield, RefreshCw } from "lucide-react";

export default function Dashboard({ data, onRefresh, loading }) {
  if (!data) return null;

  const { subjects, overall } = data;

  const overallSafeBunks = subjects.reduce((acc, s) => acc + s.safeBunks, 0);
  const atRisk = subjects.filter((s) => s.riskLevel === "red").length;
  const safe = subjects.filter((s) => s.riskLevel === "green").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overall Stats */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white transition-colors">
              Overview
            </h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5 transition-colors">
              Semester at a glance
            </p>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-xl border border-light-500 dark:border-dark-500 text-slate-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-white dark:hover:border-indigo-500 transition-all duration-300"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Big circular indicator */}
          <div className="flex flex-col items-center gap-2">
            <RiskIndicator
              percentage={overall.overallPercentage}
              riskLevel={overall.riskLevel}
              size="lg"
            />
            <p className="text-xs text-slate-500 dark:text-gray-400 uppercase tracking-widest transition-colors">
              Overall Attendance
            </p>
          </div>

          {/* Stats grid */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
            <StatBox
              icon={BookOpen}
              label="Total Conducted"
              value={overall.totalConducted}
              color="text-indigo-400"
              bgColor="bg-indigo-500/10"
            />
            <StatBox
              icon={Users}
              label="Total Attended"
              value={overall.totalAttended}
              color="text-cyan-400"
              bgColor="bg-cyan-500/10"
            />
            <StatBox
              icon={Shield}
              label="Safe Bunks Left"
              value={overallSafeBunks}
              color="text-purple-400"
              bgColor="bg-purple-500/10"
            />
            <StatBox
              icon={TrendingUp}
              label="Subjects Safe"
              value={`${safe}/${subjects.length}`}
              color="text-emerald-400"
              bgColor="bg-emerald-500/10"
            />
            <StatBox
              icon={TrendingUp}
              label="At Risk"
              value={atRisk}
              color="text-rose-400"
              bgColor="bg-rose-500/10"
            />
            <StatBox
              icon={TrendingUp}
              label="In Warning"
              value={subjects.filter((s) => s.riskLevel === "yellow").length}
              color="text-amber-400"
              bgColor="bg-amber-500/10"
            />
          </div>
        </div>
      </div>

      {/* Subject Cards Grid */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-3 transition-colors">
          Subject Breakdown
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((sub) => (
            <SubjectCard key={sub._id} subject={sub} />
          ))}
        </div>
      </div>

      {/* Recent Logs */}
      {data.recentLogs && data.recentLogs.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white mb-4 transition-colors">
            Recent Activity
          </h2>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {data.recentLogs.map((log) => (
              <div
                key={log._id}
                className="flex items-center justify-between py-2 px-3 rounded-xl bg-light-800 dark:bg-dark-700 border border-light-600 dark:border-dark-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: log.subject?.color || "#6366f1" }}
                  />
                  <span className="text-sm text-slate-700 dark:text-gray-300">
                    {log.subject?.name}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-gray-500">
                    P{log.period}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 dark:text-gray-500">
                    {new Date(log.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      log.status === "present"
                        ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ icon: Icon, label, value, color, bgColor }) {
  // Use light variants for bg and replace dark borders
  const lightBgColor = bgColor.replace("500/10", "500/5").replace("bg-", "bg-");

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl border border-light-600 dark:border-dark-600 transition-colors ${bgColor.replace("/10", "/5")} dark:${bgColor}`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center ${bgColor.replace("/10", "/10")} dark:${bgColor}`}
      >
        <Icon
          size={15}
          className={`${color.replace("400", "600")} dark:${color}`}
        />
      </div>
      <div>
        <p
          className={`text-lg font-bold ${color.replace("400", "600")} dark:${color}`}
        >
          {value}
        </p>
        <p className="text-[10px] text-slate-500 dark:text-gray-500 uppercase tracking-wide leading-tight">
          {label}
        </p>
      </div>
    </div>
  );
}
