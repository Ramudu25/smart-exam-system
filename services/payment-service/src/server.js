
require("dotenv").config();

const app = require("./app");
const pool = require("./config/db");
const { connectKafka } = require("./config/kafka");

const PORT = process.env.PORT || 3002;

async function startServer() {
  try {
    await pool.query("SELECT 1");
    console.log("PostgreSQL connected");

    await connectKafka();

    app.listen(PORT, () => {
      console.log(`Payment Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start Payment Service:", error);
    process.exit(1);
  }
}

startServer();
