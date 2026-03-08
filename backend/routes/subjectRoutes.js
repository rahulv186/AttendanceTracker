const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const {
  createSubject,
  updateSubject,
  deleteSubject,
  bulkUpsertSubjects,
} = require("../controllers/subjectController");

router.use(authMiddleware);

router.post("/", createSubject);
router.put("/:id", updateSubject);
router.delete("/:id", deleteSubject);
router.post("/bulk", bulkUpsertSubjects);

module.exports = router;
