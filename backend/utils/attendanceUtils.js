/**
 * attendanceUtils.js
 * Pure helper functions for attendance calculations.
 * All functions are stateless and reusable.
 */

/**
 * Calculate attendance percentage.
 * @param {number} attended
 * @param {number} conducted
 * @returns {number} percentage (0-100)
 */
const getPercentage = (attended, conducted) => {
  if (conducted === 0) return 0;
  return parseFloat(((attended / conducted) * 100).toFixed(2));
};

/**
 * Calculate number of classes a student can safely skip
 * while keeping attendance >= 75%.
 * Formula: floor((attended - 0.75 * conducted) / 0.75)
 * @param {number} attended
 * @param {number} conducted
 * @returns {number} safe bunks (>= 0)
 */
const getSafeBunks = (attended, conducted) => {
  const val = Math.floor((attended - 0.75 * conducted) / 0.75);
  return Math.max(0, val);
};

/**
 * Calculate how many more classes a student must attend
 * to reach 75% attendance.
 * @param {number} attended
 * @param {number} conducted
 * @returns {number} classes needed (>= 0, or 0 if already >= 75%)
 */
const getClassesNeededFor75 = (attended, conducted) => {
  // 0.75 * (conducted + x) = attended + x => solve for x
  // 0.75*conducted + 0.75*x = attended + x => 0.75*conducted - attended = 0.25*x
  // x = (0.75*conducted - attended) / 0.25
  const x = Math.ceil((0.75 * conducted - attended) / 0.25);
  return Math.max(0, x);
};

/**
 * Determine risk level based on percentage.
 * @param {number} percentage
 * @returns {'green'|'yellow'|'red'}
 */
const getRiskLevel = (percentage) => {
  if (percentage >= 75) return "green";
  if (percentage >= 70) return "yellow";
  return "red";
};

/**
 * Calculate final projected percentage if student attends ALL remaining classes.
 * @param {number} attended
 * @param {number} conducted
 * @param {number} totalPlanned
 * @returns {number} projected percentage
 */
const getProjectedPercentage = (attended, conducted, totalPlanned) => {
  const remaining = totalPlanned - conducted;
  if (remaining < 0) return getPercentage(attended, conducted);
  const projectedAttended = attended + remaining;
  const projectedConducted = totalPlanned;
  return getPercentage(projectedAttended, projectedConducted);
};

/**
 * Check if reaching 75% is impossible even if student attends all remaining classes.
 * @param {number} attended
 * @param {number} conducted
 * @param {number} totalPlanned
 * @returns {boolean}
 */
const is75Impossible = (attended, conducted, totalPlanned) => {
  const projected = getProjectedPercentage(attended, conducted, totalPlanned);
  return projected < 75;
};

module.exports = {
  getPercentage,
  getSafeBunks,
  getClassesNeededFor75,
  getRiskLevel,
  getProjectedPercentage,
  is75Impossible,
};
