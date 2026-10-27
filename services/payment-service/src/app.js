const express = require("express");

const app = express();

const paymentRoutes = require("./routes/payment.routes");
app.use(express.json());

app.use("/payments", paymentRoutes);

app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "payment-service",
  });
});

module.exports = app;