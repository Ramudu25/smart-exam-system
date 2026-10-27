const express = require("express");
const hallTicketRoutes = require("./routes/hall-ticket.routes");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "hall-ticket-service",
  });
});

app.use("/hall-tickets", hallTicketRoutes);

module.exports = app;