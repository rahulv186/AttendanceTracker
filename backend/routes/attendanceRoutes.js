const express = require("express");
const router = express.Router();
const multer = require("multer");
const authMiddleware = require("../middleware/auth");
const {
  getAttendance,
  getAttendanceTimeline,
  importAttendanceFromScreenshot,
  updateAttendance,
  predictAttendance,
  getProjection,
  getTimetableForDay,
  getDayTimetableAndLogs,
  resetDb,
  seedSubjects,
  seedTimetable,
} = require("../controllers/attendanceController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed."));
    }
    cb(null, true);
  },
});

router.use(authMiddleware);

// GET  /api/attendance
router.get("/", getAttendance);
router.get("/timeline", getAttendanceTimeline);
router.post("/import-screenshot", upload.single("image"), importAttendanceFromScreenshot);

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
