const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
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

router.use(authMiddleware);

// GET  /api/attendance
router.get("/", getAttendance);

// POST /api/attendance/update
router.post("/update", updateAttendance);

// GET  /api/attendance/predict
router.get("/predict", predictAttendance);

// GET  /api/attendance/projection
router.get("/projection", getProjection);

router.get("/timetableforday", getTimetableForDay);
router.get("/day-timetable", getDayTimetableAndLogs);
router.post("/reset-db", resetDb);
router.post("/seed-subjects", seedSubjects);
router.post("/seed-timetable", seedTimetable);

module.exports = router;
