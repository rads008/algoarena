-- ============================================================
-- AlgoArena Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── Users ─────────────────────────────────────────────────────────────────────
create table if not exists public.users (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  leetcode_username   text not null unique,

  -- Profile (populated by sync)
  real_name           text,
  avatar_url          text,

  -- Live stats
  total_solved        int  default 0,
  easy_solved         int  default 0,
  medium_solved       int  default 0,
  hard_solved         int  default 0,
  today_solved        int  default 0,
  current_streak      int  default 0,
  longest_streak      int  default 0,
  streak_at_risk      boolean default false,
  points              int  default 0,

  -- Sync metadata
  last_synced_at      timestamptz,
  last_sync_error     text,
  created_at          timestamptz default now()
);

-- ── Daily Records ─────────────────────────────────────────────────────────────
create table if not exists public.daily_records (
  id                  bigserial primary key,
  user_id             uuid not null references public.users(id) on delete cascade,
  date                date not null,
  solved              int  default 0,
  total_at_time       int  default 0,
  streak_at_time      int  default 0,
  points_at_time      int  default 0,
  created_at          timestamptz default now(),

  unique(user_id, date)
);

-- ── Heatmap ───────────────────────────────────────────────────────────────────
create table if not exists public.heatmap (
  id        bigserial primary key,
  user_id   uuid not null references public.users(id) on delete cascade,
  date      date not null,
  count     int  default 0,

  unique(user_id, date)
);

-- ── Activity Feed ─────────────────────────────────────────────────────────────
create table if not exists public.activity_feed (
  id          bigserial primary key,
  user_id     uuid not null references public.users(id) on delete cascade,
  user_name   text not null,
  message     text not null,
  created_at  timestamptz default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists idx_daily_records_user_date on public.daily_records(user_id, date desc);
create index if not exists idx_heatmap_user_date       on public.heatmap(user_id, date desc);
create index if not exists idx_feed_created            on public.activity_feed(created_at desc);
create index if not exists idx_users_points            on public.users(points desc);

-- ── Row Level Security (keep data open within your app) ───────────────────────
alter table public.users          enable row level security;
alter table public.daily_records  enable row level security;
alter table public.heatmap        enable row level security;
alter table public.activity_feed  enable row level security;

-- Allow full access via service role key (backend only)
-- Public read access (for the frontend to call Supabase directly if needed)
create policy "Public read users"         on public.users         for select using (true);
create policy "Public read daily_records" on public.daily_records for select using (true);
create policy "Public read heatmap"       on public.heatmap       for select using (true);
create policy "Public read feed"          on public.activity_feed for select using (true);

-- ── Seed initial users (edit usernames as needed) ─────────────────────────────
-- Run AFTER you've confirmed the LeetCode usernames are valid
-- insert into public.users (name, leetcode_username) values
--   ('Radhika',  'radhika_lc_username'),
--   ('Simran',   'simran_lc_username'),
--   ('Sugandha', 'sugandha_lc_username');
