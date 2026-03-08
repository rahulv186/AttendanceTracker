const mongoose = require("mongoose");

// Timetable entry: which subject appears on which day and which period
const TimetableEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  day: {
    type: String,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    required: true,
  },
  period: {
    type: Number,
    required: true,
    min: 1,
    max: 8,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
});

module.exports = mongoose.model("TimetableEntry", TimetableEntrySchema);
