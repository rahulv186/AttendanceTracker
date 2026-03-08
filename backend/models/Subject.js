const mongoose = require("mongoose");

const SubjectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
    },
    shortName: {
      type: String,
      required: [true, "Subject shortname is required"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Subject code is required"],
      trim: true,
    },
    totalConducted: {
      type: Number,
      default: 0,
    },
    totalAttended: {
      type: Number,
      default: 0,
    },
    totalPlanned: {
      type: Number,
      default: 0,
      comment: "Total classes planned for the semester",
    },
    canBunk: {
      type: Number,
      default: 0,
      comment: "Number of classes student can skip while staying >= 75%",
    },
    color: {
      type: String,
      default: "#6366f1",
    },
  },
  { timestamps: true },
);

// Virtual: attendance percentage
SubjectSchema.virtual("attendancePercentage").get(function () {
  if (this.totalConducted === 0) return 0;
  return parseFloat(
    ((this.totalAttended / this.totalConducted) * 100).toFixed(2),
  );
});

// Virtual: safe bunks remaining
SubjectSchema.virtual("safeBunks").get(function () {
  // Max classes student can miss while staying >= 75%
  // 0.75 * (conducted + x) <= attended => x <= (attended - 0.75*conducted) / 0.75
  const val = Math.floor(
    (this.totalAttended - 0.75 * this.totalConducted) / 0.75,
  );
  return Math.max(0, val);
});

SubjectSchema.index({ user: 1, code: 1 }, { unique: true });

SubjectSchema.set("toJSON", { virtuals: true });
SubjectSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Subject", SubjectSchema);
