
const pool = require("../config/db");

async function createStudent(req, res) {
  try {
    const {
      studentCode,
      fullName,
      email,
      department,
      semester,
    } = req.body;

    if (
      !studentCode ||
      !fullName ||
      !email ||
      !department ||
      !Number.isInteger(semester) ||
      semester < 1 ||
      semester > 12
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid student details are required.",
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO students
        (student_code, full_name, email, department, semester)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [studentCode, fullName, email, department, semester]
    );

    return res.status(201).json({
      success: true,
      message: "Student registered successfully.",
      data: rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Student code or email already exists.",
      });
    }

    console.error("Create student error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}

async function getStudentById(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID.",
      });
    }

    const { rows } = await pool.query(
      "SELECT * FROM students WHERE id = $1",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    return res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Get student error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}

async function listStudents(req, res) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );

    const offset = (page - 1) * limit;

    const { rows } = await pool.query(
      `SELECT id, student_code, full_name, email, department,
              semester, created_at
       FROM students
       ORDER BY id
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return res.json({
      success: true,
      page,
      limit,
      data: rows,
    });
  } catch (error) {
    console.error("List students error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}

module.exports = {
  createStudent,
  getStudentById,
  listStudents,
};
