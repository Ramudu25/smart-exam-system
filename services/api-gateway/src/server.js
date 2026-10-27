
require("dotenv").config();

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "api-gateway",
  });
});

function createServiceProxy(target, servicePath) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,

    pathRewrite: (path) => `${servicePath}${path}`,

    on: {
      error: (error, req, res) => {
        console.error("Proxy error:", error.message);

        if (res.headersSent || res.destroyed) return;

        res.writeHead(503, {
          "Content-Type": "application/json",
        });

        res.end(
          JSON.stringify({
            success: false,
            message: "The requested service is temporarily unavailable.",
          })
        );
      },
    },
  });
}

app.use(
  "/students",
  createServiceProxy(process.env.STUDENT_SERVICE_URL, "/students")
);

app.use(
  "/payments",
  createServiceProxy(process.env.PAYMENT_SERVICE_URL, "/payments")
);

app.use(
  "/hall-tickets",
  createServiceProxy(process.env.HALL_TICKET_SERVICE_URL, "/hall-tickets")
);

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
