
const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "payment-service",
  brokers: ["localhost:9092"],
});

const producer = kafka.producer();

async function connectKafka() {
  await producer.connect();
  console.log("Kafka producer connected");
}

module.exports = {
  producer,
  connectKafka,
};
