import RiskIndicator from "./RiskIndicator";
import { BookOpen, Shield } from "lucide-react";
import { getRiskColor } from "../utils/helpers";

export default function SubjectCard({ subject }) {
  const {
    name,
    code,
    totalConducted,
    totalAttended,
    attendancePercentage,
    safeBunks,
    riskLevel,
    color,
  } = subject;

  const pct = Math.min(100, Math.max(0, attendancePercentage));

  const riskLabel =
    riskLevel === "green"
      ? "Safe"
      : riskLevel === "yellow"
        ? "Warning"
        : "At Risk";

  return (
    <div className="glass-card p-5 flex flex-col gap-4 animate-slide-up">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${color}15`,
                border: `1px solid ${color}30`,
              }}
            >
              <BookOpen size={16} style={{ color }} />
            </div>

            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white text-sm leading-tight transition-colors">
                {name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-500 font-mono mt-0.5 transition-colors">
                {code}
              </p>
            </div>
          </div>

          <span className={`risk-badge ${riskLevel}`}>{riskLabel}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-500 dark:text-gray-400 mb-1.5 transition-colors">
          <span>{totalAttended} attended</span>
          <span>{totalConducted} conducted</span>
        </div>

        <div className="h-1.5 rounded-full bg-light-600 dark:bg-dark-600 overflow-hidden transition-colors">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}80`,
            }}
          />
        </div>

        {/* 75% marker */}
        <div className="relative h-0 mt-0">
          <div
            className="absolute -top-3 w-0.5 h-3 bg-white/20"
            style={{ left: "75%" }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between pt-1">
        <div className="text-center">
          <p className={`text-xl font-bold ${getRiskColor(riskLevel)}`}>
            {attendancePercentage.toFixed(1)}%
          </p>
          <p className="text-[10px] text-slate-500 dark:text-gray-500 uppercase tracking-widest mt-0.5 transition-colors">
            Attendance
          </p>
        </div>

        <div className="h-8 w-px bg-light-600 dark:bg-dark-600 transition-colors" />

        <div className="text-center">
          <div className="flex items-center gap-1 justify-center">
            <Shield
              size={12}
              className="text-indigo-500 dark:text-indigo-400"
            />
            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 transition-colors">
              {safeBunks}
            </p>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-gray-500 uppercase tracking-widest mt-0.5 transition-colors">
            Safe Bunks
          </p>
        </div>

        <div className="h-8 w-px bg-light-600 dark:bg-dark-600 transition-colors" />

        <div className="text-center">
          <p className="text-xl font-bold text-slate-700 dark:text-gray-300 transition-colors">
            {pct >= 75
              ? "✓"
              : `${Math.ceil((0.75 * totalConducted - totalAttended) / 0.25)}`}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-gray-500 uppercase tracking-widest mt-0.5 transition-colors">
            {pct >= 75 ? "OK" : "Need"}
          </p>
        </div>
      </div>
    </div>
  );
}
