import { getRiskBg, getRiskGlow } from "../utils/helpers";

export default function RiskIndicator({ percentage, riskLevel, size = "md" }) {
  const radius = size === "lg" ? 52 : 40;
  const stroke = size === "lg" ? 7 : 5;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(100, Math.max(0, percentage));
  const offset = circumference - (clampedPct / 100) * circumference;

  const colorMap = {
    green: "#30d158",
    yellow: "#ff9f0a",
    red: "#ff453a",
  };
  const color = colorMap[riskLevel] || "#0a84ff";
  const svgSize = (radius + stroke + 4) * 2;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ filter: `drop-shadow(${getRiskGlow(riskLevel)})` }}
    >
      <svg width={svgSize} height={svgSize}>
        {/* Background ring */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-slate-200 dark:text-dark-600 transition-colors"
          strokeWidth={stroke}
        />
        {/* Progress ring */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${svgSize / 2} ${svgSize / 2})`}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className={`font-bold ${size === "lg" ? "text-2xl" : "text-lg"}`}
          style={{ color }}
        >
          {clampedPct.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
