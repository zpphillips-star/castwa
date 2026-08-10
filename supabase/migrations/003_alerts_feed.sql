-- ============================================================
-- CastWA: Live Alerts Feed tables
-- Migration 003 — daily_updates + emergency_alerts + regulations_live
--
-- These tables are the source-of-truth for time-sensitive alert data
-- so that alert changes do NOT require a new app build.
-- Web and native apps fetch from these on launch/refresh and fall back
-- to bundled static data if Supabase is unreachable.
-- ============================================================

-- Enable UUID generation if not already enabled
create extension if not exists "pgcrypto";

-- ─── daily_updates ────────────────────────────────────────────────────────────
-- Matches the DailyUpdate interface in lib/daily-updates.ts
-- Populated by the sync script / admin API (service role only).

create table if not exists daily_updates (
  id           text primary key,
  category     text not null check (category in (
                 'halibut','salmon-marine','salmon-freshwater',
                 'shrimp','crab','biotoxin','freshwater','general'
               )),
  priority     text not null check (priority in ('alert','highlight','info')),
  icon         text not null default '🎣',
  featured_label text not null,
  featured     boolean not null default true,
  headline     text not null,
  subtext      text not null default '',
  detail       text not null,
  active_from  date not null,
  active_to    date,
  wdfw_url     text not null,
  published_at timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_daily_updates_active
  on daily_updates (active_from, active_to);

create index if not exists idx_daily_updates_featured
  on daily_updates (featured, active_from);

-- ─── emergency_alerts ─────────────────────────────────────────────────────────
-- Matches the EmergencyAlert interface in lib/emergency-alerts.ts

create table if not exists emergency_alerts (
  id          text primary key,
  type        text not null check (type in ('OPEN','CLOSED','MODIFIED')),
  species     text not null,
  water_body  text not null,
  description text not null,
  active_from date not null,
  active_to   date,
  wdfw_url    text not null,
  published_at timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_emergency_alerts_active
  on emergency_alerts (active_from, active_to);

-- ─── regulations_live ─────────────────────────────────────────────────────────
-- Matches the RegEntry interface in castwa-native/lib/regulations-data.ts
-- Used by native app to show current emergency rules list without rebuilding.

create table if not exists regulations_live (
  id             text primary key,
  title          text not null,
  body           text not null,
  severity       text not null check (severity in ('info','warning','emergency','closure')),
  waters         text[] not null default '{}',
  species        text[] not null default '{}',
  effective_date date not null,
  expires_date   date,
  source         text not null,
  is_emergency   boolean not null default false,
  rule_ref       text,
  published_at   timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_regulations_live_active
  on regulations_live (effective_date, expires_date);

create index if not exists idx_regulations_live_emergency
  on regulations_live (is_emergency);

-- ─── Row-Level Security ───────────────────────────────────────────────────────
-- Anon role (app clients): read-only.
-- Write access requires service_role key (sync scripts only).

alter table daily_updates    enable row level security;
alter table emergency_alerts enable row level security;
alter table regulations_live enable row level security;

-- Allow all authenticated and anon users to read
create policy "anon_read_daily_updates"
  on daily_updates for select
  using (true);

create policy "anon_read_emergency_alerts"
  on emergency_alerts for select
  using (true);

create policy "anon_read_regulations_live"
  on regulations_live for select
  using (true);

-- ─── Helper: updated_at auto-stamp ───────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_daily_updates_updated_at
  before update on daily_updates
  for each row execute function set_updated_at();

create trigger trg_emergency_alerts_updated_at
  before update on emergency_alerts
  for each row execute function set_updated_at();

create trigger trg_regulations_live_updated_at
  before update on regulations_live
  for each row execute function set_updated_at();

-- ─── Convenience view: currently active alerts ────────────────────────────────
create or replace view active_emergency_alerts as
select *
from emergency_alerts
where active_from <= current_date
  and (active_to is null or active_to >= current_date)
order by
  case type when 'CLOSED' then 0 when 'MODIFIED' then 1 else 2 end,
  active_from desc;

create or replace view active_daily_updates as
select *
from daily_updates
where featured = true
  and active_from <= current_date
  and (active_to is null or active_to >= current_date)
order by
  case priority when 'alert' then 0 when 'highlight' then 1 else 2 end,
  active_from desc
limit 10;
