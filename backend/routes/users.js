// backend/routes/users.js
const express = require("express");
const router = express.Router();
const supabase = require("../lib/supabase");
const { fetchUserProfile } = require("../services/leetcode");

// GET /api/users — list all users with full stats
router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("points", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/users — register a new user (one-time setup)
router.post("/", async (req, res) => {
  const { name, leetcode_username } = req.body;
  if (!name || !leetcode_username) {
    return res.status(400).json({ error: "name and leetcode_username are required" });
  }

  // Validate username exists on LeetCode first
  try {
    await fetchUserProfile(leetcode_username);
  } catch (e) {
    return res.status(422).json({ error: `LeetCode user "${leetcode_username}" not found` });
  }

  const { data, error } = await supabase
    .from("users")
    .insert({ name, leetcode_username })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Username already registered" });
    }
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
});

// GET /api/users/:id — single user full profile
router.get("/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error) return res.status(404).json({ error: "User not found" });
  res.json(data);
});

module.exports = router;
