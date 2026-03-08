const Subject = require("../models/Subject");
const AttendanceLog = require("../models/AttendanceLog");
const TimetableEntry = require("../models/Timetable");
const {
  getPercentage,
  getSafeBunks,
  getRiskLevel,
  getProjectedPercentage,
  is75Impossible,
  getClassesNeededFor75,
} = require("../utils/attendanceUtils");
const {
  buildDaySchedule,
  runPrediction,
} = require("../utils/predictionEngine");

// ─── GET /attendance ──────────────────────────────────────────────────────────
/**
 * Returns all subjects with attendance stats + recent logs.
 */
const getAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const subjects = await Subject.find({ user: userId });

    const data = subjects.map((sub) => {
      const pct = getPercentage(sub.totalAttended, sub.totalConducted);
      return {
        _id: sub._id,
        name: sub.name,
        code: sub.code,
        totalConducted: sub.totalConducted,
        totalAttended: sub.totalAttended,
        totalPlanned: sub.totalPlanned,
        attendancePercentage: pct,
        safeBunks: getSafeBunks(sub.totalAttended, sub.totalConducted),
        riskLevel: getRiskLevel(pct),
        color: sub.color,
      };
    });

    // Overall attendance
    const totalConducted = subjects.reduce(
      (acc, s) => acc + s.totalConducted,
      0,
    );
    const totalAttended = subjects.reduce((acc, s) => acc + s.totalAttended, 0);
    const overallPercentage = getPercentage(totalAttended, totalConducted);

    // Recent logs (last 20)
    const recentLogs = await AttendanceLog.find({ user: userId })
      .populate("subject", "name code color")
      .sort({ date: -1, period: -1 })
      .limit(20);

    res.json({
      success: true,
      subjects: data,
      overall: {
        totalConducted,
        totalAttended,
        overallPercentage,
        riskLevel: getRiskLevel(overallPercentage),
      },
      recentLogs,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /attendance/update ──────────────────────────────────────────────────
/**
 * Body: { subjectId, date, period, status: 'present'|'absent' }
 * Logs the attendance and updates subject counters.
 */
const updateAttendance = async (req, res) => {
  try {
    const { subjectId, date, period, status } = req.body;

    if (!subjectId || !date || !period || !status) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: subjectId, date, period, status",
      });
    }

    if (!["present", "absent"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Status must be present or absent" });
    }

    const userId = req.user.id;
    const subject = await Subject.findOne({ _id: subjectId, user: userId });
    if (!subject) {
      return res
        .status(404)
        .json({ success: false, message: "Subject not found" });
    }

    // Check for duplicate log for same date+period+subject
    const existing = await AttendanceLog.findOne({
      user: userId,
      subject: subjectId,
      date: new Date(date),
      period,
    });
    if (existing) {
      // Update existing log
      const oldStatus = existing.status;
      existing.status = status;
      await existing.save();

      // Adjust counters
      if (oldStatus !== status) {
        if (status === "present") subject.totalAttended += 1;
        else subject.totalAttended -= 1;
      }
    } else {
      // New log
      await AttendanceLog.create({
        user: userId,
        subject: subjectId,
        date: new Date(date),
        period,
        status,
      });
      subject.totalConducted += 1;
      if (status === "present") subject.totalAttended += 1;
    }

    await subject.save();

    const pct = getPercentage(subject.totalAttended, subject.totalConducted);
    res.json({
      success: true,
      message: "Attendance updated",
      subject: {
        _id: subject._id,
        name: subject.name,
        code: subject.code,
        totalConducted: subject.totalConducted,
        totalAttended: subject.totalAttended,
        attendancePercentage: pct,
        safeBunks: getSafeBunks(subject.totalAttended, subject.totalConducted),
        riskLevel: getRiskLevel(pct),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /attendance/predict ──────────────────────────────────────────────────
/**
 * Simulates from today using timetable to find when each subject hits 75%.
 */
const predictAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const subjects = await Subject.find({ user: userId });
    const timetable = await TimetableEntry.find({ user: userId }).populate("subject");

    if (timetable.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No timetable configured. Please seed the database.",
      });
    }

    const daySchedule = buildDaySchedule(timetable);

    // Semester end: 30th April of current year (configurable)
    const today = new Date();
    const semesterEnd = new Date(today.getFullYear(), 3, 30); // April 30

    const { subjectResults, allSafeDate, allReached } = runPrediction(
      today,
      semesterEnd,
      daySchedule,
      subjects,
    );

    // Also include classesNeededFor75
    const enriched = {};
    for (const sub of subjects) {
      const id = sub._id.toString();
      enriched[id] = {
        ...subjectResults[id],
        classesNeededFor75: getClassesNeededFor75(
          sub.totalAttended,
          sub.totalConducted,
        ),
        currentPercentage: getPercentage(sub.totalAttended, sub.totalConducted),
      };
    }

    res.json({
      success: true,
      simulatedFrom: today,
      semesterEnd,
      subjectResults: enriched,
      allSafeDate,
      allReached,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /attendance/projection ───────────────────────────────────────────────
/**
 * Calculates final % if student attends ALL remaining classes.
 * Also tells if 75% is impossible.
 */
const getProjection = async (req, res) => {
  try {
    const userId = req.user.id;
    const subjects = await Subject.find({ user: userId });

    const projections = subjects.map((sub) => {
      const currentPct = getPercentage(sub.totalAttended, sub.totalConducted);
      const projectedPct = getProjectedPercentage(
        sub.totalAttended,
        sub.totalConducted,
        sub.totalPlanned,
      );
      const impossible = is75Impossible(
        sub.totalAttended,
        sub.totalConducted,
        sub.totalPlanned,
      );
      const remaining = Math.max(0, sub.totalPlanned - sub.totalConducted);

      return {
        _id: sub._id,
        name: sub.name,
        code: sub.code,
        currentPercentage: currentPct,
        projectedPercentage: projectedPct,
        is75Impossible: impossible,
        classesRemaining: remaining,
        totalPlanned: sub.totalPlanned,
        riskLevel: getRiskLevel(currentPct),
        color: sub.color,
      };
    });

    // Overall projection
    const totalConducted = subjects.reduce((a, s) => a + s.totalConducted, 0);
    const totalAttended = subjects.reduce((a, s) => a + s.totalAttended, 0);
    const totalPlanned = subjects.reduce((a, s) => a + s.totalPlanned, 0);
    const overallProjected = getProjectedPercentage(
      totalAttended,
      totalConducted,
      totalPlanned,
    );

    res.json({
      success: true,
      projections,
      overallProjection: {
        currentPercentage: getPercentage(totalAttended, totalConducted),
        projectedPercentage: overallProjected,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getTimetableForDay = async (req, res) => {
  try {
    const { day, period, date } = req.query;
    const userId = req.user.id;

    const entry = await TimetableEntry.findOne({
      user: userId,
      day,
      period: Number(period),
    }).populate("subject");

    if (!entry) {
      return res.json({
        success: true,
        subject: null,
        alreadyMarked: false,
      });
    }

    const existingLog = await AttendanceLog.findOne({
      user: userId,
      subject: entry.subject._id,
      date: new Date(date),
      period: Number(period),
    });

    res.json({
      success: true,
      subject: entry.subject,
      alreadyMarked: !!existingLog,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getDayTimetableAndLogs = async (req, res) => {
  try {
    const { date } = req.query; // Expecting date string like 'YYYY-MM-DD'
    const userId = req.user.id;

    if (!date) {
      return res
        .status(400)
        .json({ success: false, message: "Date is required" });
    }

    const targetDate = new Date(date);
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayOfWeek = dayNames[targetDate.getDay()];

    // Fetch timetable for the day
    const timetable = await TimetableEntry.find({ user: userId, day: dayOfWeek })
      .populate("subject")
      .sort({ period: 1 });

    // Fetch existing logs for the specific date
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const logs = await AttendanceLog.find({
      user: userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    const logsMap = {};
    for (const log of logs) {
      logsMap[log.period] = log;
    }

    const result = timetable.map((entry) => {
      const existingLog = logsMap[entry.period];
      return {
        _id: entry._id, // Timetable entry ID
        period: entry.period,
        subject: entry.subject,
        hasLog: !!existingLog,
        logStatus: existingLog ? existingLog.status : "present", // Default to present
      };
    });

    res.json({
      success: true,
      day: dayOfWeek,
      date: targetDate,
      classes: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const SUBJECTS = [
  {
    name: "Design and Analysis of Algorithms",
    shortName: "DAA",
    code: "21CSC204J",
    totalConducted: 41,
    totalAttended: 28,
    totalPlanned: 75,
    color: "#22d3ee",
    canBunk: 18,
  },
  {
    name: "Database Management Systems",
    shortName: "DBMS",
    code: "21CSC205P",
    totalConducted: 35,
    totalAttended: 24,
    totalPlanned: 60,
    color: "#f59e0b",
    canBunk: 15,
  },
  {
    name: "Artificial Intelligence",
    shortName: "AI",
    code: "21CSC206T",
    totalConducted: 21,
    totalAttended: 15,
    totalPlanned: 45,
    color: "#10b981",
    canBunk: 11,
  },
  {
    name: "Digital Image Processing",
    shortName: "DIP",
    code: "21CSE251T",
    totalConducted: 23,
    totalAttended: 16,
    totalPlanned: 45,
    color: "#f43f5e",
    canBunk: 11,
  },
  {
    name: "Universal Human Values",
    shortName: "UHV",
    code: "21LEM202T",
    totalConducted: 24,
    totalAttended: 18,
    totalPlanned: 45,
    color: "#f97316",
    canBunk: 11,
  },
  {
    name: "Probability and Queuing Theory",
    shortName: "PQT",
    code: "21MAB204T",
    totalConducted: 29,
    totalAttended: 20,
    totalPlanned: 60,
    color: "#6366f1",
    canBunk: 15,
  },
  {
    name: "Social Engineering",
    shortName: "SE",
    code: "21PHD201T",
    totalConducted: 16,
    totalAttended: 12,
    totalPlanned: 30,
    color: "#8b5cf6",
    canBunk: 17,
  },
  {
    name: "Critical and Creative Thinking Skills",
    shortName: "CCTS",
    code: "21PDM202L",
    totalConducted: 12,
    totalAttended: 10,
    totalPlanned: 30,
    color: "#14b8a6",
    canBunk: 7,
  },
];

const TIMETABLE_TEMPLATE = [
  { day: "Monday", period: 1, code: "21MAB204T" },
  { day: "Monday", period: 2, code: "21CSE251T" },
  { day: "Monday", period: 3, code: "21CSC204J" },
  { day: "Monday", period: 4, code: "21CSC205P" },
  { day: "Monday", period: 5, code: "21LEM202T" },
  { day: "Tuesday", period: 1, code: "21CSC206T" },
  { day: "Tuesday", period: 2, code: "21LEM202T" },
  { day: "Tuesday", period: 3, code: "21CSC204J" },
  { day: "Tuesday", period: 4, code: "21CSC205P" },
  { day: "Tuesday", period: 5, code: "21CSE251T" },
  { day: "Tuesday", period: 6, code: "21MAB204T" },
  { day: "Wednesday", period: 1, code: "21CSC204J" },
  { day: "Wednesday", period: 2, code: "21CSC204J" },
  { day: "Wednesday", period: 3, code: "21CSC205P" },
  { day: "Wednesday", period: 4, code: "21CSC205P" },
  { day: "Thursday", period: 1, code: "21PHD201T" },
  { day: "Thursday", period: 2, code: "21PHD201T" },
  { day: "Thursday", period: 3, code: "21CSC206T" },
  { day: "Thursday", period: 4, code: "21MAB204T" },
  { day: "Thursday", period: 5, code: "21LEM202T" },
  { day: "Friday", period: 1, code: "21PDM202L" },
  { day: "Friday", period: 2, code: "21PDM202L" },
  { day: "Friday", period: 3, code: "21MAB204T" },
  { day: "Friday", period: 4, code: "21CSE251T" },
  { day: "Friday", period: 5, code: "21CSC206T" },
  { day: "Friday", period: 6, code: "21CSC204J" },
];

const resetDb = async (req, res) => {
  try {
    const userId = req.user.id;
    const sResult = await Subject.deleteMany({ user: userId });
    const tResult = await TimetableEntry.deleteMany({ user: userId });
    const aResult = await AttendanceLog.deleteMany({ user: userId });
    res.json({
      success: true,
      message: `Cleared DB: ${sResult.deletedCount} subjects, ${tResult.deletedCount} timetable entries, ${aResult.deletedCount} logs.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const seedSubjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Subject.countDocuments({ user: userId });
    const overwrite = req.body && req.body.overwrite;
    if (count > 0 && !overwrite) {
      return res
        .status(400)
        .json({
          success: false,
          requireOverwrite: true,
          message: "Subjects exist. Pass overwrite: true.",
        });
    }
    if (overwrite) {
      await Subject.deleteMany({ user: userId });
      await TimetableEntry.deleteMany({ user: userId });
      await AttendanceLog.deleteMany({ user: userId });
    }
    const subjectsWithUser = SUBJECTS.map((s) => ({ ...s, user: userId }));
    const inserted = await Subject.insertMany(subjectsWithUser);
    res.json({
      success: true,
      message: `Inserted ${inserted.length} subjects.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const seedTimetable = async (req, res) => {
  try {
    const userId = req.user.id;
    const subjects = await Subject.find({ user: userId });
    if (subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No subjects found. Seed subjects first.",
      });
    }

    const codeToId = {};
    for (const sub of subjects) {
      codeToId[sub.code] = sub._id;
    }

    await TimetableEntry.deleteMany({ user: userId });

    const entries = TIMETABLE_TEMPLATE.map((t) => {
      if (!codeToId[t.code])
        throw new Error(`Subject not found for code ${t.code}`);
      return { user: userId, day: t.day, period: t.period, subject: codeToId[t.code] };
    });

    const inserted = await TimetableEntry.insertMany(entries);
    res.json({
      success: true,
      message: `Inserted ${inserted.length} timetable entries.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAttendance,
  updateAttendance,
  predictAttendance,
  getProjection,
  getTimetableForDay,
  getDayTimetableAndLogs,
  resetDb,
  seedSubjects,
  seedTimetable,
};
