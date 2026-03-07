/**
 * formatDate – formats a Date or ISO string to a readable format
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/**
 * getRiskColor – maps riskLevel to Tailwind text color class
 */
export const getRiskColor = (level) => {
  if (level === "green") return "text-emerald-400";
  if (level === "yellow") return "text-amber-400";
  return "text-rose-400";
};

/**
 * getRiskBg – maps riskLevel to background color (for progress bars)
 */
export const getRiskBg = (level) => {
  if (level === "green") return "bg-emerald-500";
  if (level === "yellow") return "bg-amber-500";
  return "bg-rose-500";
};

/**
 * getRiskGlow – maps riskLevel to glow box-shadow
 */
export const getRiskGlow = (level) => {
  if (level === "green") return "0 0 12px rgba(16,185,129,0.4)";
  if (level === "yellow") return "0 0 12px rgba(245,158,11,0.4)";
  return "0 0 12px rgba(244,63,94,0.4)";
};

/**
 * clamp – clamp number between min and max
 */
export const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
