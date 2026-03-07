const Subject = require("../models/Subject");
const AttendanceLog = require("../models/AttendanceLog");
const TimetableEntry = require("../models/Timetable");

const createSubject = async (req, res) => {
  try {
    const data = req.body;

    // Auto-calculate canBunk if missing (assuming 75% rule)
    if (data.canBunk === undefined && data.totalPlanned) {
      data.canBunk = Math.floor(data.totalPlanned * 0.25);
    }

    const subject = await Subject.create(data);
    res.status(201).json({ success: true, subject });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const subject = await Subject.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!subject)
      return res
        .status(404)
        .json({ success: false, message: "Subject not found" });

    res.json({ success: true, subject });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findByIdAndDelete(id);

    if (!subject)
      return res
        .status(404)
        .json({ success: false, message: "Subject not found" });

    // Cascade delete associated logs and timetable entries
    await AttendanceLog.deleteMany({ subject: id });
    await TimetableEntry.deleteMany({ subject: id });

    res.json({ success: true, message: "Subject deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const bulkUpsertSubjects = async (req, res) => {
  try {
    const { subjects } = req.body; // Array of objects containing _id (optional) and subject data

    if (!Array.isArray(subjects)) {
      return res
        .status(400)
        .json({ success: false, message: "Expected an array of subjects" });
    }

    const operations = subjects.map((sub) => {
      if (sub._id && sub._id.length === 24) {
        // Update existing (excluding _id from $set)
        const { _id, ...updateData } = sub;
        return {
          updateOne: {
            filter: { _id },
            update: { $set: updateData },
          },
        };
      } else {
        // Insert new (removing temporary IDs if present)
        const { _id, ...insertData } = sub;
        return {
          insertOne: {
            document: insertData,
          },
        };
      }
    });

    if (operations.length > 0) {
      await Subject.bulkWrite(operations);
    }

    res.json({ success: true, message: "Subjects saved successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createSubject,
  updateSubject,
  deleteSubject,
  bulkUpsertSubjects,
};
