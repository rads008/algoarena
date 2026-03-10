// backend/routes/stats.js
const express = require("express");
const router = express.Router();
const supabase = require("../lib/supabase");

// GET /api/stats/leaderboard — ranked by points
router.get("/leaderboard", async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, leetcode_username, avatar_url, total_solved, today_solved, current_streak, longest_streak, points, streak_at_risk, last_synced_at")
    .order("points", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const ranked = data.map((u, i) => ({ ...u, rank: i + 1 }));
  res.json(ranked);
});

// GET /api/stats/heatmap/:userId — 365-day heatmap
router.get("/heatmap/:userId", async (req, res) => {
  const { data, error } = await supabase
    .from("heatmap")
    .select("date, count")
    .eq("user_id", req.params.userId)
    .order("date", { ascending: true })
    .limit(365);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/stats/daily/:userId — last 90 days of daily records
router.get("/daily/:userId", async (req, res) => {
  const days = parseInt(req.query.days ?? "90", 10);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("daily_records")
    .select("date, solved, total_at_time, streak_at_time, points_at_time")
    .eq("user_id", req.params.userId)
    .gte("date", since.toISOString().slice(0, 10))
    .order("date", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/stats/weekly/:userId — last 7 days solved per day
router.get("/weekly/:userId", async (req, res) => {
  const since = new Date();
  since.setDate(since.getDate() - 6);

  const { data, error } = await supabase
    .from("heatmap")
    .select("date, count")
    .eq("user_id", req.params.userId)
    .gte("date", since.toISOString().slice(0, 10))
    .order("date", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  // Fill missing days with 0
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    const found = data.find((r) => r.date === ds);
    result.push({ date: ds, count: found?.count ?? 0 });
  }
  res.json(result);
});

// GET /api/stats/summary — aggregate stats across all users
router.get("/summary", async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select("total_solved, today_solved, current_streak, points");

  if (error) return res.status(500).json({ error: error.message });

  const summary = {
    totalSolvedAll: data.reduce((a, u) => a + (u.total_solved ?? 0), 0),
    todaySolvedAll: data.reduce((a, u) => a + (u.today_solved ?? 0), 0),
    totalPointsAll: data.reduce((a, u) => a + (u.points ?? 0), 0),
    topStreak: Math.max(...data.map((u) => u.current_streak ?? 0)),
  };

  res.json(summary);
});

module.exports = router;
