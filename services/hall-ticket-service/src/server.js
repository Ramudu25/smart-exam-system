require("dotenv").config();

const app = require("./app");
const pool = require("./config/db");
const { startPaymentConsumer } = require("./consumers/payment.consumer");
const { connectRedis } = require("./config/redis");

const PORT = process.env.PORT || 3003;

async function startServer() {
  try {
    await pool.query("SELECT 1");
    console.log("PostgreSQL connected");

    // Redis is optional; do not block service startup.
    connectRedis().catch((error) => {
      console.error(
        "Redis unavailable; continuing without cache:",
        error.message,
      );
    });

    await startPaymentConsumer();

    app.listen(PORT, () => {
      console.log(`Hall Ticket Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start Hall Ticket Service:", error);
    process.exit(1);
  }
}

startServer();
