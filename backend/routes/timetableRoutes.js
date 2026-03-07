const express = require("express");
const router = express.Router();
const {
  getTimetables,
  bulkSaveTimetable,
} = require("../controllers/timetableController");

router.get("/", getTimetables);
router.post("/bulk", bulkSaveTimetable);

module.exports = router;
