
const express = require("express");
const {
  createStudent,
  getStudentById,
  listStudents,
} = require("../controllers/student.controller");

const router = express.Router();

router.post("/", createStudent);
router.get("/", listStudents);
router.get("/:id", getStudentById);

module.exports = router;
