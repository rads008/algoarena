require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const supabase = require("../lib/supabase");
const { fetchUserProfile, buildHeatmap, getSolvedOnDate } = require("./leetcode");
const { calculateStreaks } = require("./streak");

const TODAY = new Date().toISOString().slice(0, 10);

async function syncUser(dbUser) {
  const { id, leetcode_username, name } = dbUser;
  console.log(`[sync] Fetching ${leetcode_username}...`);

  let profile;

  try {
    profile = await fetchUserProfile(leetcode_username);
  } catch (err) {
    console.error(`[sync] Failed for ${leetcode_username}: ${err.message}`);

    await supabase
      .from("users")
      .update({
        last_sync_error: err.message,
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", id);

    return;
  }

  const heatmap = buildHeatmap(profile.submissionCalendar);
  const todaySolved = getSolvedOnDate(profile.submissionCalendar, TODAY);

  const { current: streak, longest, atRisk } = calculateStreaks(heatmap);

  const points = todaySolved * 300;

  // ── Get previous solved count BEFORE updating user ───────────────────────
  const { data: previousUser } = await supabase
    .from("users")
    .select("today_solved")
    .eq("id", id)
    .single();

  const previousSolved = previousUser?.today_solved ?? 0;

  // ── Update user stats ─────────────────────────────────────────────────────
  const { error: userErr } = await supabase
    .from("users")
    .update({
      real_name: profile.realName,
      avatar_url: profile.avatar,
      total_solved: profile.totalSolved,
      easy_solved: profile.easySolved,
      medium_solved: profile.mediumSolved,
      hard_solved: profile.hardSolved,
      today_solved: todaySolved,
      current_streak: streak,
      longest_streak: longest,
      streak_at_risk: atRisk,
      points,
      last_synced_at: new Date().toISOString(),
      last_sync_error: null,
    })
    .eq("id", id);

  if (userErr) console.error("[sync] user update error:", userErr.message);

  // ── Upsert daily record ───────────────────────────────────────────────────
  const { error: dailyErr } = await supabase
    .from("daily_records")
    .upsert(
      {
        user_id: id,
        date: TODAY,
        solved: todaySolved,
        total_at_time: profile.totalSolved,
        streak_at_time: streak,
        points_at_time: points,
      },
      { onConflict: "user_id,date" }
    );

  if (dailyErr) console.error("[sync] daily record error:", dailyErr.message);

  // ── Write heatmap ─────────────────────────────────────────────────────────
  const heatmapRows = heatmap.map((h) => ({
    user_id: id,
    date: h.date,
    count: h.count,
  }));

  for (let i = 0; i < heatmapRows.length; i += 100) {
    const chunk = heatmapRows.slice(i, i + 100);

    const { error: hmErr } = await supabase
      .from("heatmap")
      .upsert(chunk, { onConflict: "user_id,date" });

    if (hmErr) console.error("[sync] heatmap upsert error:", hmErr.message);
  }

  // ── Activity feed (ONLY when solved increases) ────────────────────────────
  if (todaySolved > previousSolved) {
    await supabase.from("activity_feed").insert({
      user_id: id,
      user_name: name,
      message: `${name} solved ${todaySolved} problem${
        todaySolved > 1 ? "s" : ""
      } today 🚀`,
      created_at: new Date().toISOString(),
    });
  }

  console.log(
    `[sync] ✓ ${leetcode_username}: ${todaySolved} today, ${profile.totalSolved} total, streak ${streak}`
  );
}

async function runSync() {
  console.log(`[sync] Starting sync at ${new Date().toISOString()}`);

  const { data: users, error } = await supabase
    .from("users")
    .select("id, name, leetcode_username");

  if (error || !users?.length) {
    console.error("[sync] Could not fetch users:", error?.message);
    return;
  }

  for (const user of users) {
    await syncUser(user);

    // polite delay to avoid rate limits
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log("[sync] Done.");
}

// Run directly
if (require.main === module) {
  runSync()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

module.exports = { runSync };
