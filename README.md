# ⚔️ AlgoArena

> Gamified LeetCode tracker — daily coding competition for Radhika, Simran & Sugandha.

---

## 🗂️ Project Structure

```
algoarena/
├── backend/
│   ├── server.js              ← Express entry point + cron scheduler
│   ├── lib/
│   │   └── supabase.js        ← Supabase client
│   ├── routes/
│   │   ├── users.js           ← GET/POST /api/users
│   │   ├── stats.js           ← /api/stats/leaderboard|heatmap|weekly|daily|summary
│   │   ├── feed.js            ← /api/feed
│   │   └── sync.js            ← POST /api/sync (manual trigger)
│   ├── services/
│   │   ├── leetcode.js        ← LeetCode GraphQL fetcher
│   │   ├── streak.js          ← Streak calculator (≥3/day rule)
│   │   └── syncJob.js         ← Full sync orchestrator
│   └── package.json
│
├── frontend/
│   ├── public/index.html
│   └── src/
│       ├── App.jsx            ← Main app (Dashboard / Leaderboard / Feed)
│       ├── index.js
│       ├── lib/api.js         ← API client (all fetch calls)
│       ├── hooks/useData.js   ← Central data hook (polls every 30s)
│       └── components/
│           └── Setup.jsx      ← First-time username setup screen
│
└── supabase/
    └── schema.sql             ← Full database schema (run once)
```

---

## 🚀 Setup Guide

### Step 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Name it `algoarena`, choose a region close to India
3. Copy your **Project URL** and **service_role secret key** (Settings → API)

### Step 2 — Run the database schema

1. In Supabase dashboard → **SQL Editor**
2. Paste the entire contents of `supabase/schema.sql`
3. Click **Run** ✅

### Step 3 — Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs...
PORT=4000
FRONTEND_URL=http://localhost:3000
```

### Step 4 — Install & run the backend

```bash
cd backend
npm install
npm run dev        # development (auto-restart)
# OR
npm start          # production
```

The backend will:
- Start on `http://localhost:4000`
- **Immediately sync** LeetCode data on startup
- **Auto-sync every hour** via cron job

### Step 5 — Set up the frontend

```bash
cd frontend
npm install
npm start          # opens http://localhost:3000
```

### Step 6 — First-time setup in the app

When you open the app for the first time, you'll see a **username setup screen**.

Enter the real LeetCode usernames for each friend:
- Radhika → her LeetCode username (e.g. `radhika123`)
- Simran  → her LeetCode username
- Sugandha → her LeetCode username

The app validates each username against LeetCode live before saving. After setup, data syncs automatically — no manual input ever needed.

---

## 🌐 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users with full stats |
| POST | `/api/users` | Register a user (validates LeetCode username) |
| GET | `/api/stats/leaderboard` | Ranked leaderboard |
| GET | `/api/stats/heatmap/:userId` | 365-day heatmap |
| GET | `/api/stats/weekly/:userId` | Last 7 days count |
| GET | `/api/stats/daily/:userId` | Daily records (last 90 days default) |
| GET | `/api/stats/summary` | Aggregate stats across all users |
| GET | `/api/feed` | Activity feed (latest 20) |
| POST | `/api/sync` | Trigger manual sync |
| GET | `/api/sync/status` | Sync status |
| GET | `/api/health` | Health check |

---

## 🎮 Streak Rules

| Situation | Result |
|-----------|--------|
| ≥ 3 problems today | ✅ Streak maintained |
| < 3 problems today | ❌ Streak broken |
| < 3 yesterday but ≥ 5 today | 🔄 Streak restored |

Points: **1 problem = 300 pts**

---

## ☁️ Deploy to Production

### Backend → Railway (recommended)

1. Push `backend/` to a GitHub repo
2. Create a new project on [railway.app](https://railway.app)
3. Connect your GitHub repo
4. Add environment variables (same as `.env`)
5. Railway auto-deploys on push

### Frontend → Vercel

1. Push `frontend/` to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Add env variable:
   ```
   REACT_APP_API_URL=https://your-railway-backend.up.railway.app/api
   ```
4. Deploy ✅

### Alternative: Deploy both on Render

- Backend: New Web Service → `npm start`
- Frontend: New Static Site → `npm run build` → publish `build/`

---

## 🔔 Browser Notifications (Optional)

To enable streak-at-risk notifications, add to your frontend:

```js
// In App.jsx useEffect
if (Notification.permission === "default") {
  Notification.requestPermission();
}
// When streak_at_risk is true:
new Notification("⚠️ AlgoArena", { body: `${user.name}'s streak is at risk today!` });
```

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| Data source | LeetCode GraphQL API |
| Scheduler | node-cron (hourly) |
| Deployment | Vercel + Railway |

---

## ⚠️ LeetCode API Notes

LeetCode's GraphQL API is public but unofficial:
- No API key required
- May occasionally return errors — the sync job handles these gracefully
- Profiles must be **public** on LeetCode for data to be fetched
- Rate-limited to ~1 request/1.5s in the sync job to be respectful

---


