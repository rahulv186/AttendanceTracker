/**
 * seed.js – Populates the database with a demo user and sample subjects/timetable.
 * Run: node seed.js
 * Multi-user: all seeded data is assigned to the demo user (demo@example.com).
 */

require("dotenv").config();
const colors = require("colors");
const mongoose = require("mongoose");
const User = require("./models/User");
const Subject = require("./models/Subject");
const TimetableEntry = require("./models/Timetable");
const AttendanceLog = require("./models/AttendanceLog");
const connectDB = require("./config/db");

const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "demo123";

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
// Fixed weekly timetable: day -> [{ period, subjectCode }]
const TIMETABLE_TEMPLATE = [
  // MONDAY
  { day: "Monday", period: 1, code: "21MAB204T" }, // PQT
  { day: "Monday", period: 2, code: "21CSE251T" }, // DIP
  { day: "Monday", period: 3, code: "21CSC204J" }, // DAA
  { day: "Monday", period: 4, code: "21CSC205P" }, // DBMS
  { day: "Monday", period: 5, code: "21LEM202T" }, // UHV

  // TUESDAY
  { day: "Tuesday", period: 1, code: "21CSC206T" }, // AI
  { day: "Tuesday", period: 2, code: "21LEM202T" }, // UHV
  { day: "Tuesday", period: 3, code: "21CSC204J" }, // DAA
  { day: "Tuesday", period: 4, code: "21CSC205P" }, // DBMS
  { day: "Tuesday", period: 5, code: "21CSE251T" }, // DIP
  { day: "Tuesday", period: 6, code: "21MAB204T" }, // PQT

  // WEDNESDAY
  { day: "Wednesday", period: 1, code: "21CSC204J" }, // DAA
  { day: "Wednesday", period: 2, code: "21CSC204J" }, // DAA
  { day: "Wednesday", period: 3, code: "21CSC205P" }, // DBMS
  { day: "Wednesday", period: 4, code: "21CSC205P" }, // DBMS

  // THURSDAY
  { day: "Thursday", period: 1, code: "21PHD201T" }, // SE
  { day: "Thursday", period: 2, code: "21PHD201T" }, // SE
  { day: "Thursday", period: 3, code: "21CSC206T" }, // AI
  { day: "Thursday", period: 4, code: "21MAB204T" }, // PQT
  { day: "Thursday", period: 5, code: "21LEM202T" }, // UHV

  // FRIDAY
  { day: "Friday", period: 1, code: "21PDM202L" }, // CCTS
  { day: "Friday", period: 2, code: "21PDM202L" }, // CCTS
  { day: "Friday", period: 3, code: "21MAB204T" }, // PQT
  { day: "Friday", period: 4, code: "21CSE251T" }, // DIP
  { day: "Friday", period: 5, code: "21CSC206T" }, // AI
  { day: "Friday", period: 6, code: "21CSC204J" }, // DAA
];

const seed = async () => {
  await connectDB();

  let user = await User.findOne({ email: DEMO_EMAIL });
  if (!user) {
    user = await User.create({
      name: "Demo User",
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
    console.log(`Created demo user: ${DEMO_EMAIL}`.green);
  } else {
    console.log(`Using existing demo user: ${DEMO_EMAIL}`.yellow);
  }
  const userId = user._id;

  // Clear existing data for this user
  await Subject.deleteMany({ user: userId });
  await TimetableEntry.deleteMany({ user: userId });
  await AttendanceLog.deleteMany({ user: userId });
  console.log("Cleared existing data for demo user".yellow);

  // Insert subjects with user
  const subjectsWithUser = SUBJECTS.map((s) => ({ ...s, user: userId }));
  const insertedSubjects = await Subject.insertMany(subjectsWithUser);
  console.log(`Inserted ${insertedSubjects.length} subjects`.green);

  const codeToId = {};
  for (const sub of insertedSubjects) {
    codeToId[sub.code] = sub._id;
  }

  const timetableEntries = TIMETABLE_TEMPLATE.map((entry) => ({
    user: userId,
    day: entry.day,
    period: entry.period,
    subject: codeToId[entry.code],
  }));
  await TimetableEntry.insertMany(timetableEntries);
  console.log(`Inserted ${timetableEntries.length} timetable entries`.green);

  console.log("Seed complete! Log in with demo@example.com / demo123".cyan.bold);
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
