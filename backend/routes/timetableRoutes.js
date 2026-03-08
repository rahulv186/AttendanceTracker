const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const {
  getTimetables,
  bulkSaveTimetable,
} = require("../controllers/timetableController");

router.use(authMiddleware);

router.get("/", getTimetables);
router.post("/bulk", bulkSaveTimetable);

module.exports = router;
