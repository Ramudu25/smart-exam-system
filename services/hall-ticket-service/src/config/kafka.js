require("dotenv").config();

const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "hall-ticket-service",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

const consumer = kafka.consumer({
  groupId: "hall-ticket-group",
});

module.exports = { consumer };