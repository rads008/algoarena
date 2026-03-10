// backend/services/leetcode.js
const axios = require("axios");

const LEETCODE_API = "https://leetcode.com/graphql";

const HEADERS = {
  "Content-Type": "application/json",
  "Referer": "https://leetcode.com",
  "User-Agent":
    "Mozilla/5.0 (compatible; AlgoArena/1.0)",
};

// ── Fetch user profile & stats ────────────────────────────────────────────────

async function fetchUserProfile(username) {
  username = username.trim();
  const query = `
    query userPublicProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          realName
          userAvatar
          ranking
          reputation
        }
        submitStats: submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
        }
        userCalendar(year: ${new Date().getFullYear()}) {
          activeYears
          streak
          totalActiveDays
          submissionCalendar
        }
      }
    }
  `;

  const { data } = await axios.post(
    LEETCODE_API,
    { query, variables: { username } },
    { headers: HEADERS, timeout: 10000 }
  );

  if (!data?.data?.matchedUser) {
    throw new Error(`User "${username}" not found on LeetCode`);
  }

  const user = data.data.matchedUser;
  const acStats = user.submitStats.acSubmissionNum;

  const totalSolved = acStats.find((d) => d.difficulty === "All")?.count ?? 0;
  const easySolved  = acStats.find((d) => d.difficulty === "Easy")?.count ?? 0;
  const mediumSolved= acStats.find((d) => d.difficulty === "Medium")?.count ?? 0;
  const hardSolved  = acStats.find((d) => d.difficulty === "Hard")?.count ?? 0;

  // Parse submission calendar (unix_timestamp → count)
  const calendarRaw = JSON.parse(user.userCalendar?.submissionCalendar ?? "{}");

  return {
    username: user.username,
    realName: user.profile.realName,
    avatar: user.profile.userAvatar,
    ranking: user.profile.ranking,
    totalSolved,
    easySolved,
    mediumSolved,
    hardSolved,
    streak: user.userCalendar?.streak ?? 0,
    totalActiveDays: user.userCalendar?.totalActiveDays ?? 0,
    submissionCalendar: calendarRaw,
  };
}

// ── Get problems solved ON a specific date (YYYY-MM-DD) ───────────────────────
function getSolvedOnDate(submissionCalendar, dateStr) {
  const date = new Date(dateStr + "T00:00:00Z");
  const startTs = Math.floor(date.getTime() / 1000);
  const endTs = startTs + 86400;

  let count = 0;
  for (const [ts, cnt] of Object.entries(submissionCalendar)) {
    const t = parseInt(ts, 10);
    if (t >= startTs && t < endTs) count += cnt;
  }
  return count;
}

// ── Build 365-day heatmap array ───────────────────────────────────────────────
function buildHeatmap(submissionCalendar) {
  const result = [];
  const now = new Date();

  for (let i = 364; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    result.push({
      date: dateStr,
      count: getSolvedOnDate(submissionCalendar, dateStr),
    });
  }
  return result;
}

module.exports = { fetchUserProfile, getSolvedOnDate, buildHeatmap };
