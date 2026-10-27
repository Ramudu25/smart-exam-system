
const express = require("express");
const studentRoutes = require("./routes/student.routes");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ success: true, service: "student-service" });
});

app.use("/students", studentRoutes);

module.exports = app;
