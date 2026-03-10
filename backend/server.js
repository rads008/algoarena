// backend/server.js
require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const cron    = require("node-cron");
const rateLimit = require("express-rate-limit");

const usersRouter = require("./routes/users");
const statsRouter = require("./routes/stats");
const feedRouter  = require("./routes/feed");
const syncRouter  = require("./routes/sync");
const { runSync } = require("./services/syncJob");

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL ?? "http://localhost:3000",
        "https://algoarena-beryl.vercel.app"

  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

app.use(express.json());

app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: "Too many requests, slow down!" },
}));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/users", usersRouter);
app.use("/api/stats", statsRouter);
app.use("/api/feed",  feedRouter);
app.use("/api/sync",  syncRouter);

app.get("/api/health", (req, res) =>
  res.json({ status: "ok", time: new Date().toISOString() })
);

// 404 fallback
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message ?? "Internal server error" });
});

// ── Cron: fast sync every 20 seconds ─────────────────────────────────
cron.schedule("*/20 * * * * *", async () => {
  console.log("[cron] Fast sync triggered");
  try {
    await runSync();
  } catch (e) {
    console.error("[cron] sync failed:", e.message);
  }
});
// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => {
  console.log(`🚀 AlgoArena backend running on port ${PORT}`);
  // Sync on startup
  runSync().catch((e) => console.error("[startup sync]", e.message));
});
