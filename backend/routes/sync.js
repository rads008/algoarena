// backend/routes/sync.js
const express = require("express");
const router = express.Router();
const { runSync } = require("../services/syncJob");

let isSyncing = false;
let lastSyncAt = null;

// POST /api/sync — trigger a manual sync (debounced)
router.post("/", async (req, res) => {
  if (isSyncing) {
    return res.status(429).json({ message: "Sync already in progress", lastSyncAt });
  }

  isSyncing = true;
  res.json({ message: "Sync started", startedAt: new Date().toISOString() });

  try {
    await runSync();
    lastSyncAt = new Date().toISOString();
  } catch (e) {
    console.error("[sync route] error:", e.message);
  } finally {
    isSyncing = false;
  }
});

// GET /api/sync/status
router.get("/status", (req, res) => {
  res.json({ isSyncing, lastSyncAt });
});

module.exports = router;
