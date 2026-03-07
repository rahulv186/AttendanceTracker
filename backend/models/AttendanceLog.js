const mongoose = require("mongoose");

const AttendanceLogSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    period: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["present", "absent"],
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AttendanceLog", AttendanceLogSchema);
