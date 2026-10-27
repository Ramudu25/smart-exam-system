const pool = require("../config/db");

const { producer } = require("../config/kafka");
async function createPayment(req, res) {
  try {
    const { studentId, amount, idempotencyKey } = req.body;

    if (
      !Number.isSafeInteger(studentId) ||
      studentId <= 0 ||
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !Number.isInteger(amount * 100) ||
      typeof idempotencyKey !== "string" ||
      !idempotencyKey.trim() ||
      idempotencyKey.trim().length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid studentId, amount, and idempotencyKey are required.",
      });
    }

    const key = idempotencyKey.trim();

    // Fast path: return an existing payment.
    const existing = await pool.query(
      `SELECT * FROM payments WHERE idempotency_key = $1`,
      [key],
    );

    if (existing.rows.length > 0) {
      const payment = existing.rows[0];

      if (
        Number(payment.student_id) !== studentId ||
        Number(payment.amount) !== amount
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Idempotency key was already used with different payment details.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Payment request already processed.",
        data: payment,
      });
    }

    // Verify the student exists.
    const student = await pool.query(`SELECT id FROM students WHERE id = $1`, [
      studentId,
    ]);

    if (student.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    // Attempt the insert. The UNIQUE constraint protects concurrent requests.
    const result = await pool.query(
      `INSERT INTO payments
        (student_id, amount, status, idempotency_key)
       VALUES ($1, $2, 'success', $3)
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING *`,
      [studentId, amount, key],
    );

    if (result.rows.length > 0) {
      await producer.send({
        topic: "payment.succeeded",
        messages: [
          {
            key: String(result.rows[0].student_id),
            value: JSON.stringify({
              eventId: `payment-${result.rows[0].id}`,
              paymentId: result.rows[0].id,
              studentId: result.rows[0].student_id,
              amount: result.rows[0].amount,
              status: result.rows[0].status,
              occurredAt: new Date().toISOString(),
            }),
          },
        ],
      });
      return res.status(201).json({
        success: true,
        message: "Mock payment successful.",
        data: result.rows[0],
      });
    }

    // Another concurrent request inserted the same key first.
    const duplicate = await pool.query(
      `SELECT * FROM payments WHERE idempotency_key = $1`,
      [key],
    );

    if (duplicate.rows.length === 0) {
      return res.status(503).json({
        success: false,
        message: "Unable to confirm payment. Please retry with the same key.",
      });
    }

    const payment = duplicate.rows[0];

    if (
      Number(payment.student_id) !== studentId ||
      Number(payment.amount) !== amount
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Idempotency key was already used with different payment details.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment request already processed.",
      data: payment,
    });
  } catch (error) {
    console.error("Create payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}

async function getPaymentById(req, res) {
  try {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID.",
      });
    }

    const { rows } = await pool.query(`SELECT * FROM payments WHERE id = $1`, [
      id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Get payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}

module.exports = { createPayment, getPaymentById };
