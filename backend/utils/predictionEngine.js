/**
 * predictionEngine.js
 * Simulates the semester from today forward using the weekly timetable
 * to determine when each subject will reach 75% attendance.
 */

const { getPercentage } = require("./attendanceUtils");

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * Build a lookup: dayName -> [{ subjectId, subjectCode, period }]
 * from an array of timetable entries (populated with subject).
 * @param {Array} timetableEntries
 * @returns {Object}
 */
const buildDaySchedule = (timetableEntries) => {
  const schedule = {};
  for (const entry of timetableEntries) {
    const day = entry.day;
    if (!schedule[day]) schedule[day] = [];
    schedule[day].push({
      subjectId: entry.subject._id.toString(),
      subjectCode: entry.subject.code,
      subjectName: entry.subject.name,
      period: entry.period,
    });
  }
  return schedule;
};

/**
 * Run the prediction simulation.
 * Advances day-by-day from `startDate`, assuming student attends ALL classes.
 * Records the date each subject first reaches >= 75%.
 *
 * @param {Date} startDate - simulation start (today)
 * @param {Date} semesterEndDate - stop simulating here
 * @param {Object} daySchedule - from buildDaySchedule()
 * @param {Array} subjects - array of Subject documents {_id, code, name, totalAttended, totalConducted}
 * @param {number} maxDays - safety cap (default 365)
 * @returns {{
 *   subjectResults: Object,  // subjectId -> { reachedDate, reachedPeriod, reachedPercentage }
 *   allSafeDate: Date|null,  // date when ALL subjects reach 75%
 * }}
 */
const runPrediction = (
  startDate,
  semesterEndDate,
  daySchedule,
  subjects,
  maxDays = 365,
) => {
  // Clone current state
  const state = {};
  for (const sub of subjects) {
    state[sub._id.toString()] = {
      attended: sub.totalAttended,
      conducted: sub.totalConducted,
      name: sub.name,
      code: sub.code,
      reached75: null,
    };
  }

  const end = semesterEndDate || new Date(startDate.getFullYear(), 11, 31);
  let current = new Date(startDate);
  let day = 0;

  while (current <= end && day < maxDays) {
    const dayName = DAY_NAMES[current.getDay()];
    const periods = daySchedule[dayName] || [];

    for (const slot of periods) {
      const subState = state[slot.subjectId];
      if (!subState) continue;

      subState.conducted += 1;
      subState.attended += 1; // simulate student attends all

      const pct = getPercentage(subState.attended, subState.conducted);
      if (!subState.reached75 && pct >= 75) {
        subState.reached75 = {
          date: new Date(current),
          period: slot.period,
          percentage: pct,
        };
      }
    }

    // Advance to next day
    current.setDate(current.getDate() + 1);
    day++;
  }

  // Find the latest "reached75" date -> allSafeDate
  let allSafeDate = null;
  const subjectResults = {};
  let allReached = true;

  for (const [id, s] of Object.entries(state)) {
    subjectResults[id] = {
      name: s.name,
      code: s.code,
      reached75: s.reached75 ? s.reached75 : null,
    };
    if (!s.reached75) {
      allReached = false;
    } else {
      if (!allSafeDate || s.reached75.date > allSafeDate) {
        allSafeDate = s.reached75.date;
      }
    }
  }

  return {
    subjectResults,
    allSafeDate: allReached ? allSafeDate : null,
    allReached,
  };
};

module.exports = { buildDaySchedule, runPrediction };
