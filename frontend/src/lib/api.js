// frontend/src/lib/api.js
const BASE = process.env.REACT_APP_API_URL ?? "https://algoarena-zess.onrender.com/api";

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(msg.error ?? res.statusText);
  }
  return res.json();
}

export const api = {
  getUsers:       ()         => get("/users"),
  createUser:     (body)     => post("/users", body),
  getLeaderboard: ()         => get("/stats/leaderboard"),
  getSummary:     ()         => get("/stats/summary"),
  getHeatmap:     (userId)   => get(`/stats/heatmap/${userId}`),
  getWeekly:      (userId)   => get(`/stats/weekly/${userId}`),
  getDaily:       (userId, days=90) => get(`/stats/daily/${userId}?days=${days}`),
  getFeed:        ()         => get("/feed"),
  triggerSync:    ()         => post("/sync", {}),
  getSyncStatus:  ()         => get("/sync/status"),
};
