// backend/routes/feed.js
const express = require("express");
const router = express.Router();
const supabase = require("../lib/supabase");

// GET /api/feed — latest activity (most recent first)
router.get("/", async (req, res) => {
  const limit = parseInt(req.query.limit ?? "20", 10);

  const { data, error } = await supabase
    .from("activity_feed")
    .select(`
      id,
      message,
      created_at,
      user_id,
      user_name,
      users ( avatar_url, leetcode_username )
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
