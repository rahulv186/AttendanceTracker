const TimetableEntry = require("../models/Timetable");

const getTimetables = async (req, res) => {
  try {
    const userId = req.user.id;
    const entries = await TimetableEntry.find({ user: userId })
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
    const userId = req.user.id;

    if (!Array.isArray(timetables)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Expected an array of timetable entries",
        });
    }

    await TimetableEntry.deleteMany({ user: userId });

    if (timetables.length > 0) {
      const withUser = timetables.map((t) => ({ ...t, user: userId }));
      await TimetableEntry.insertMany(withUser);
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
