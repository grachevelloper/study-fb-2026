import "dotenv/config";
import express from "express";
import os from "node:os";

const app = express();

const port = Number(process.env.PORT || 3000);
const instanceName = process.env.INSTANCE_NAME || `backend-${port}`;
let requestCount = 0;

app.use(express.json());

app.get("/", (_req, res) => {
  requestCount += 1;

  res.json({
    message: "Response from backend server",
    instance: instanceName,
    port,
    hostname: os.hostname(),
    requestCount,
    timestamp: new Date().toISOString()
  });
});

app.get("/api/info", (_req, res) => {
  requestCount += 1;

  res.json({
    service: "practice-22-backend",
    instance: instanceName,
    port,
    requestCount
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    instance: instanceName,
    port
  });
});

app.listen(port, () => {
  console.log(`${instanceName} started on port ${port}`);
});
