
const express = require("express");
const { createPayment, getPaymentById } = require("../controllers/payment.controller");

const router = express.Router();

router.post("/", createPayment);
router.get("/:id", getPaymentById);

module.exports = router;
