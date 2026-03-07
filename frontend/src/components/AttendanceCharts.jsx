import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#1a1a27",
      borderColor: "#2d2d4a",
      borderWidth: 1,
      titleColor: "#e5e7eb",
      bodyColor: "#9ca3af",
      padding: 10,
      cornerRadius: 10,
    },
  },
  scales: {
    x: {
      grid: { color: "rgba(255,255,255,0.04)", drawBorder: false },
      ticks: { color: "#6b7280", font: { size: 11 } },
    },
    y: {
      grid: { color: "rgba(255,255,255,0.04)", drawBorder: false },
      ticks: { color: "#6b7280", font: { size: 11 } },
      min: 0,
      max: 100,
    },
  },
};

export default function AttendanceCharts({ subjects }) {
  if (!subjects || subjects.length === 0) {
    return (
      <div className="glass-card p-8 text-center text-gray-400">
        No data available for charts.
      </div>
    );
  }

  const labels = subjects.map((s) => s.shortName || s.code);
  console.log(labels);
  const percentages = subjects.map((s) => s.attendancePercentage);
  const safeBunks = subjects.map((s) => s.safeBunks);

  const colorMap = {
    green: "rgba(16,185,129,0.8)",
    yellow: "rgba(245,158,11,0.8)",
    red: "rgba(244,63,94,0.8)",
  };

  const barColors = subjects.map(
    (s) => colorMap[s.riskLevel] || "rgba(99,102,241,0.8)",
  );
  const borderColors = subjects.map((s) =>
    s.riskLevel === "green"
      ? "#10b981"
      : s.riskLevel === "yellow"
        ? "#f59e0b"
        : "#f43f5e",
  );

  // Bar chart: attendance % per subject
  const barData = {
    labels,
    datasets: [
      {
        label: "Attendance %",
        data: percentages,
        backgroundColor: barColors,
        borderColor: borderColors,
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const barOptions = {
    ...CHART_DEFAULTS,
    plugins: {
      ...CHART_DEFAULTS.plugins,
      tooltip: {
        ...CHART_DEFAULTS.plugins.tooltip,
        callbacks: {
          label: (ctx) => ` ${ctx.parsed.y.toFixed(1)}%`,
        },
      },
    },
  };

  // Line chart: attendance growth (cumulative simulation across sorted subjects)
  const sortedSubjects = [...subjects].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const lineData = {
    labels: sortedSubjects.map((s) => s.code),
    datasets: [
      {
        label: "Attendance %",
        data: sortedSubjects.map((s) => s.attendancePercentage),
        borderColor: "#6366f1",
        backgroundColor: "rgba(99,102,241,0.1)",
        pointBackgroundColor: sortedSubjects.map((s) =>
          s.riskLevel === "green"
            ? "#10b981"
            : s.riskLevel === "yellow"
              ? "#f59e0b"
              : "#f43f5e",
        ),
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Safe bunks bar chart
  const bunksData = {
    labels,
    datasets: [
      {
        label: "Safe Bunks",
        data: safeBunks,
        backgroundColor: "rgba(99,102,241,0.7)",
        borderColor: "#6366f1",
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const bunksOptions = {
    ...CHART_DEFAULTS,
    scales: {
      ...CHART_DEFAULTS.scales,
      y: {
        ...CHART_DEFAULTS.scales.y,
        min: 0,
        max: undefined,
      },
    },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Bar chart - risk overview */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-1">
          Subject Attendance %
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Color indicates risk level · Dashed line at 75%
        </p>
        <div className="relative h-56">
          <Bar
            data={barData}
            options={{
              ...barOptions,
              plugins: {
                ...barOptions.plugins,
                annotation: undefined,
              },
            }}
          />
          {/* 75% line overlay */}
          <div
            className="absolute left-0 right-0 border-t border-dashed border-white/20 pointer-events-none"
            style={{ top: `${(1 - 75 / 100) * 100}%` }}
          >
            <span className="absolute -top-4 right-0 text-[10px] text-gray-500">
              75%
            </span>
          </div>
        </div>
      </div>

      {/* Line chart - attendance trend */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-1">
          Attendance Trend
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Subject-wise attendance percentage comparison
        </p>
        <div className="h-56">
          <Line data={lineData} options={CHART_DEFAULTS} />
        </div>
      </div>

      {/* Safe bunks chart */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-1">
          Safe Bunks Available
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Number of classes you can skip while staying above 75%
        </p>
        <div className="h-48">
          <Bar data={bunksData} options={bunksOptions} />
        </div>
      </div>
    </div>
  );
}
