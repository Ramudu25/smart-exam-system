const express = require("express");
const pool = require("../config/db");

const router = express.Router();

const { redisClient } = require("../config/redis");

// GET /hall-tickets/ticket/:ticketNumber
router.get("/ticket/:ticketNumber", async (req, res) => {
  try {
    const { ticketNumber } = req.params;

    // 1. Check Redis cache.
    const cacheKey = `hall-ticket:${ticketNumber}`;
    let cachedTicket = null;

    try {
      cachedTicket = await redisClient.get(cacheKey);
    } catch (error) {
      console.error("Redis cache read failed:", error.message);
    }

    if (cachedTicket) {
      return res.json({
        success: true,
        source: "redis",
        data: JSON.parse(cachedTicket),
      });
    }

    // 2. Cache miss: query PostgreSQL.
    const result = await pool.query(
      `SELECT id, student_id, payment_id, ticket_number, status, created_at
       FROM hall_tickets
       WHERE ticket_number = $1`,
      [ticketNumber],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Hall ticket not found.",
      });
    }

    const ticket = result.rows[0];

    // 3. Cache the ticket for 5 minutes.
    try {
      await redisClient.set(cacheKey, JSON.stringify(ticket), {
        EX: 300,
      });
    } catch (error) {
      console.error("Redis cache write failed:", error.message);
    }

    return res.json({
      success: true,
      source: "postgres",
      data: ticket,
    });
  } catch (error) {
    console.error("Fetch hall ticket error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch hall ticket.",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         id,
         student_id,
         payment_id,
         ticket_number,
         status,
         created_at
       FROM hall_tickets
       ORDER BY id DESC`,
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Fetch hall tickets error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch hall tickets.",
    });
  }
});

module.exports = router;
