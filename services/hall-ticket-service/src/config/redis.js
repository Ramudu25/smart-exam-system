
require("dotenv").config();

const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
 socket: {
  reconnectStrategy: (retries) => {
    return Math.min(retries * 1000, 5000);
  },
},
});

redisClient.on("error", (error) => {
  console.error("Redis error:", error.message);
});
redisClient.on("ready", () => {
  console.log("Redis reconnected and ready");
});

async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  console.log("Redis connected");
}

module.exports = { redisClient, connectRedis };
