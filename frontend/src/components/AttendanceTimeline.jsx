import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Loader, AlertTriangle } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: "index",
    intersect: false,
  },
  plugins: {
    legend: {
      position: "top",
      labels: {
        color: "#9ca3af",
        boxWidth: 10,
        boxHeight: 10,
        usePointStyle: true,
        pointStyle: "circle",
      },
    },
    tooltip: {
      backgroundColor: "#1a1a27",
      borderColor: "#2d2d4a",
      borderWidth: 1,
      titleColor: "#e5e7eb",
      bodyColor: "#d1d5db",
      padding: 10,
      cornerRadius: 10,
      callbacks: {
        label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}%`,
      },
    },
  },
  scales: {
    x: {
      grid: { color: "rgba(255,255,255,0.04)", drawBorder: false },
      ticks: { color: "#6b7280", font: { size: 10 }, maxTicksLimit: 14 },
    },
    y: {
      min: 0,
      max: 100,
      grid: { color: "rgba(255,255,255,0.06)", drawBorder: false },
      ticks: {
        color: "#6b7280",
        callback: (value) => `${value}%`,
      },
    },
  },
};

export default function AttendanceTimeline({
  data,
  loading,
  error,
  onRetry,
}) {
  if (loading) {
    return (
      <div className="glass-card p-10 flex flex-col items-center gap-3">
        <Loader size={22} className="animate-spin text-indigo-400" />
        <p className="text-sm text-gray-400">Loading attendance timeline...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 border border-rose-500/30">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={16} className="text-rose-400" />
          <h3 className="font-semibold text-white">Could not load timeline</h3>
        </div>
        <p className="text-sm text-gray-400 mb-4">{error}</p>
        <button onClick={onRetry} className="btn-primary text-sm">
          Retry
        </button>
      </div>
    );
  }

  if (!data || !data.labels || data.labels.length === 0) {
    return (
      <div className="glass-card p-8 text-center text-gray-400">
        No attendance logs yet. Mark daily attendance to see your timeline.
      </div>
    );
  }

  const lineData = {
    labels: data.labels.map((item) => item.label),
    datasets: data.subjects.map((subject) => ({
      label: subject.shortName || subject.code || subject.name,
      data: subject.data,
      borderColor: subject.color || "#6366f1",
      backgroundColor: subject.color || "#6366f1",
      pointRadius: 1.5,
      pointHoverRadius: 5,
      borderWidth: 2,
      tension: 0.25,
      spanGaps: true,
    })),
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-1">
          Subject-wise Attendance Timeline
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Day 1 to now · cumulative attendance percentage for each subject
        </p>
        <div className="h-[420px]">
          <Line data={lineData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
