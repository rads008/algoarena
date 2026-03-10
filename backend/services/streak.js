// backend/services/streak.js
// Rules:
//   - Need ≥ 3 problems/day to maintain streak
//   - Solving ≥ 5 the NEXT day after a break restores streak

/**
 * Given a sorted array of { date: "YYYY-MM-DD", count: number }
 * calculate current streak, longest streak, and whether today's streak is at risk.
 */
function calculateStreaks(heatmap) {
  if (!heatmap || heatmap.length === 0) return { current: 0, longest: 0, atRisk: true };

  const MIN_DAILY  = 3;  // minimum to maintain
  const RESTORE_MIN = 5; // minimum to restore after a miss

  let current = 0;
  let longest = 0;
  let runStreak = 0;
  let prevMissed = false;

  for (let i = 0; i < heatmap.length; i++) {
    const { count } = heatmap[i];
    const maintained = count >= MIN_DAILY;
    const restored   = prevMissed && count >= RESTORE_MIN;

    if (maintained || restored) {
      runStreak++;
      prevMissed = false;
    } else {
      if (runStreak > longest) longest = runStreak;
      runStreak = 0;
      prevMissed = !maintained;
    }
  }

  if (runStreak > longest) longest = runStreak;
  current = runStreak;

  // At risk: today is the last entry and count < MIN_DAILY
  const todayCount = heatmap[heatmap.length - 1]?.count ?? 0;
  const atRisk = todayCount < MIN_DAILY;

  return { current, longest, atRisk, todayCount };
}

module.exports = { calculateStreaks };
