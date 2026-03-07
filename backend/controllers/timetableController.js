const TimetableEntry = require("../models/Timetable");

const getTimetables = async (req, res) => {
  try {
    const entries = await TimetableEntry.find({})
      .populate("subject", "name code color")
      .sort({ day: 1, period: 1 });
    res.json({ success: true, timetables: entries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const bulkSaveTimetable = async (req, res) => {
  try {
    const { timetables } = req.body; // Array of { day, period, subject }

    if (!Array.isArray(timetables)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Expected an array of timetable entries",
        });
    }

    // Completely wipe old timetable to avoid orphan overlaps since user is sending full state
    await TimetableEntry.deleteMany({});

    if (timetables.length > 0) {
      await TimetableEntry.insertMany(timetables);
    }

    res.json({ success: true, message: "Timetable updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getTimetables,
  bulkSaveTimetable,
};
