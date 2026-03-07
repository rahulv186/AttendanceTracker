const express = require("express");
const router = express.Router();
const {
  getAttendance,
  updateAttendance,
  predictAttendance,
  getProjection,
  getTimetableForDay,
  getDayTimetableAndLogs,
  resetDb,
  seedSubjects,
  seedTimetable,
} = require("../controllers/attendanceController");

// GET  /api/attendance
router.get("/", getAttendance);

// POST /api/attendance/update
router.post("/update", updateAttendance);

// GET  /api/attendance/predict
router.get("/predict", predictAttendance);

// GET  /api/attendance/projection
router.get("/projection", getProjection);

// `/api/timetable?day=${day}&period=${period}&date=${date}`,
router.get("/timetableforday", getTimetableForDay);

// GET /api/attendance/day-timetable?date=YYYY-MM-DD
router.get("/day-timetable", getDayTimetableAndLogs);

// POST /api/attendance/reset-db
router.post("/reset-db", resetDb);

// POST /api/attendance/seed-subjects
router.post("/seed-subjects", seedSubjects);

// POST /api/attendance/seed-timetable
router.post("/seed-timetable", seedTimetable);

module.exports = router;
