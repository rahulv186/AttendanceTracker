import { useState, useEffect } from "react";
import { fetchProjection } from "../services/api";
import { TrendingUp, TrendingDown, AlertTriangle, Loader } from "lucide-react";

export default function ProjectionPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchProjection();
        setData(res);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
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
          Calculating projections...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 bg-rose-50 dark:bg-dark-800">
        <p className="text-rose-600 dark:text-rose-400 text-sm transition-colors">
          {error}
        </p>
      </div>
    );
  }

  const { projections, overallProjection } = data;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Overall projection banner */}
      <div className="glass-card p-5 border border-indigo-500/20 bg-indigo-50/50 dark:bg-dark-800 transition-colors">
        <h3 className="text-sm text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-2 transition-colors">
          Overall Semester Projection
        </h3>
        <div className="flex items-center gap-6">
          <div>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 transition-colors">
              {overallProjection.projectedPercentage.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500 dark:text-gray-500 mt-0.5 transition-colors">
              If all remaining classes attended
            </p>
          </div>
          <div className="text-slate-400 dark:text-gray-500 text-sm transition-colors">
            vs current
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-500 dark:text-gray-400 transition-colors">
              {overallProjection.currentPercentage.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500 dark:text-gray-500 mt-0.5 transition-colors">
              Current overall
            </p>
          </div>
        </div>
      </div>

      {/* Projection table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-light-600 dark:border-dark-600 bg-light-800 dark:bg-dark-700 transition-colors">
              <th className="text-left py-3 px-4 text-xs text-slate-500 dark:text-gray-400 uppercase tracking-widest font-medium transition-colors">
                Subject
              </th>
              <th className="text-center py-3 px-4 text-xs text-slate-500 dark:text-gray-400 uppercase tracking-widest font-medium transition-colors">
                Current
              </th>
              <th className="text-center py-3 px-4 text-xs text-slate-500 dark:text-gray-400 uppercase tracking-widest font-medium transition-colors">
                Projected
              </th>
              <th className="text-center py-3 px-4 text-xs text-slate-500 dark:text-gray-400 uppercase tracking-widest font-medium transition-colors">
                Remaining
              </th>
              <th className="text-center py-3 px-4 text-xs text-slate-500 dark:text-gray-400 uppercase tracking-widest font-medium transition-colors">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {projections.map((p, i) => (
              <ProjectionRow key={p._id} projection={p} even={i % 2 === 0} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProjectionRow({ projection, even }) {
  const {
    name,
    code,
    currentPercentage,
    projectedPercentage,
    is75Impossible,
    classesRemaining,
    riskLevel,
  } = projection;

  const trend = projectedPercentage > currentPercentage;
  const currentColor =
    riskLevel === "green"
      ? "text-emerald-600 dark:text-emerald-400"
      : riskLevel === "yellow"
        ? "text-amber-500 dark:text-amber-400"
        : "text-rose-600 dark:text-rose-400";

  return (
    <tr
      className={`border-b border-light-600 dark:border-dark-600 transition-colors hover:bg-light-700 dark:hover:bg-dark-700 ${even ? "bg-white dark:bg-dark-800" : "bg-light-800/50 dark:bg-dark-900/50"}`}
    >
      <td className="py-3.5 px-4">
        <div className="font-semibold text-slate-800 dark:text-white text-sm transition-colors">
          {name}
        </div>
        <div className="text-xs text-slate-500 dark:text-gray-500 font-mono transition-colors">
          {code}
        </div>
      </td>
      <td
        className={`py-3.5 px-4 text-center font-bold transition-colors ${currentColor}`}
      >
        {currentPercentage.toFixed(1)}%
      </td>
      <td className="py-3.5 px-4 text-center">
        <span
          className={`font-bold transition-colors ${is75Impossible ? "text-rose-600 dark:text-rose-400" : projectedPercentage >= 75 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500 dark:text-amber-400"}`}
        >
          {projectedPercentage.toFixed(1)}%
        </span>
      </td>
      <td className="py-3.5 px-4 text-center text-slate-600 dark:text-gray-300 font-medium transition-colors">
        {classesRemaining}
      </td>
      <td className="py-3.5 px-4 text-center">
        {is75Impossible ? (
          <div className="flex items-center justify-center gap-1 text-rose-600 dark:text-rose-400 transition-colors">
            <AlertTriangle size={12} />
            <span className="text-xs font-semibold">Impossible</span>
          </div>
        ) : trend ? (
          <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 transition-colors">
            <TrendingUp size={12} />
            <span className="text-xs font-semibold">Improving</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1 text-amber-500 dark:text-amber-400 transition-colors">
            <TrendingDown size={12} />
            <span className="text-xs font-semibold">Same</span>
          </div>
        )}
      </td>
    </tr>
  );
}
