import { useState, useEffect } from "react";
import { fetchPrediction } from "../services/api";
import { formatDate } from "../utils/helpers";
import {
  Zap,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Loader,
} from "lucide-react";

export default function PredictionPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPrediction();
      setData(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-8 flex items-center justify-center gap-3">
        <Loader
          size={20}
          className="animate-spin text-indigo-600 dark:text-indigo-400"
        />
        <span className="text-slate-500 dark:text-gray-400 transition-colors">
          Running prediction simulation...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 border-rose-500/30 bg-rose-50 dark:bg-rose-500/5">
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
          <AlertTriangle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  const results = data?.subjectResults || {};
  const allSafeDate = data?.allSafeDate;
  const allReached = data?.allReached;

  return (
    <div className="space-y-5 animate-fade-in">
      <div
        className={`glass-card p-5 border ${allReached ? "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/5" : "border-amber-500/30 bg-amber-50 dark:bg-amber-500/5"}`}
      >
        <div className="flex items-center gap-3">
          {allReached ? (
            <CheckCircle
              size={20}
              className="text-emerald-500 dark:text-emerald-400 shrink-0"
            />
          ) : (
            <AlertTriangle
              size={20}
              className="text-amber-500 dark:text-amber-400 shrink-0"
            />
          )}
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-white transition-colors">
              {allReached
                ? `All subjects safe by ${formatDate(allSafeDate)}`
                : "Not all subjects will reach 75% by semester end"}
            </p>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 transition-colors">
              Simulated from today · Assumes full attendance going forward
            </p>
          </div>
        </div>
      </div>

      {/* Per-subject prediction cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(results).map(([id, sub]) => (
          <PredictionCard key={id} subject={sub} />
        ))}
      </div>
    </div>
  );
}

function PredictionCard({ subject }) {
  const { name, code, reached75, classesNeededFor75, currentPercentage } =
    subject;
  const alreadySafe = currentPercentage >= 75;

  return (
    <div
      className={`glass-card p-5 border ${alreadySafe ? "border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5" : reached75 ? "border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5" : "border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/5"}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-white text-sm transition-colors">
            {name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-gray-500 font-mono transition-colors">
            {code}
          </p>
        </div>
        <span
          className={`text-sm font-bold ${currentPercentage >= 75 ? "text-emerald-600 dark:text-emerald-400" : currentPercentage >= 70 ? "text-amber-500 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}`}
        >
          {currentPercentage?.toFixed(1)}%
        </span>
      </div>

      {alreadySafe ? (
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <CheckCircle size={14} />
          <span className="text-xs font-medium">Already safe!</span>
        </div>
      ) : reached75 ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
            <Calendar size={13} />
            <span className="text-xs">
              Will reach 75% on <strong>{formatDate(reached75.date)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-gray-400">
            <Zap size={13} />
            <span className="text-xs">
              Need <strong>{classesNeededFor75}</strong> more consecutive
              classes
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
          <AlertTriangle size={13} />
          <span className="text-xs font-medium">
            Won't reach 75% this semester
          </span>
        </div>
      )}
    </div>
  );
}
