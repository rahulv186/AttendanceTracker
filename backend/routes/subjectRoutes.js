const express = require("express");
const router = express.Router();
const {
  createSubject,
  updateSubject,
  deleteSubject,
  bulkUpsertSubjects,
} = require("../controllers/subjectController");

router.post("/", createSubject);
router.put("/:id", updateSubject);
router.delete("/:id", deleteSubject);
router.post("/bulk", bulkUpsertSubjects);

module.exports = router;
