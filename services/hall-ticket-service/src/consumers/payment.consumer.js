
const { consumer } = require("../config/kafka");
const pool = require("../config/db");

async function startPaymentConsumer() {
  await consumer.connect();

  await consumer.subscribe({
    topic: "payment.succeeded",
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      const event = JSON.parse(message.value.toString());

      if (
        !event.eventId ||
        !Number.isSafeInteger(Number(event.paymentId)) ||
        !Number.isSafeInteger(Number(event.studentId)) ||
        event.status !== "success"
      ) {
        console.error("Invalid payment event:", event);
        return;
      }

      const result = await pool.query(
        `INSERT INTO hall_tickets (student_id, payment_id)
         SELECT $1, $2
         WHERE EXISTS (
           SELECT 1 FROM payments
           WHERE id = $2
             AND student_id = $1
             AND status = 'success'
         )
         ON CONFLICT (payment_id) DO NOTHING
         RETURNING id, student_id, payment_id, ticket_number, status, created_at`,
        [Number(event.studentId), Number(event.paymentId)],
      );

      if (result.rows.length > 0) {
        console.log("Hall ticket generated:", result.rows[0]);
      } else {
        console.log(
          "No new ticket created. Payment may be invalid or already processed:",
          event.paymentId,
        );
      }
    },
  });

  console.log("Listening for payment.succeeded events");
}

module.exports = { startPaymentConsumer };
