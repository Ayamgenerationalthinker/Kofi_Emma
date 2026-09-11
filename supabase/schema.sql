-- Abele Drums Coach — Supabase schema.
--
-- Run this once in the Supabase SQL Editor for a new project (Dashboard →
-- SQL Editor → New query → paste this whole file → Run). It is idempotent
-- (safe to re-run) via `create table if not exists` / `drop policy if
-- exists` guards.
--
-- Five tables, matching the minimal set this app actually needs — one row
-- per (user, exercise) for progress, one append-only row per practice
-- attempt, one row per (user, video) for Shed video state, one row per
-- unlocked achievement, and one profile row per user. Every table carries
-- a `user_id` (or, for `profiles`, uses the user's own id as its primary
-- key) and Row Level Security restricts every operation to
-- `auth.uid() = user_id` — a signed-in user can only ever read or write
-- their own rows. The frontend only ever holds the public anon key, which
-- is safe to ship precisely because RLS is enforced at the database, not
-- trusted to the client.

-- ---------------------------------------------------------------------------
-- profiles — one row per user, created on first sign-up.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  experience_level text not null default 'INTERMEDIATE',
  timezone text not null default 'Africa/Accra',
  onboarding_goals text[] not null default '{}',
  preferred_duration_minutes integer not null default 15,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- exercise_progress — one row per (user, exercise). Mirrors the
-- LocalStorage `ProgressRecord` shape (src/lib/storage/types.ts) exactly,
-- so the sync layer can map 1:1 between them.
-- ---------------------------------------------------------------------------
create table if not exists public.exercise_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id text not null,
  status text not null default 'LOCKED',
  clean_bpm integer not null default 0,
  best_accuracy integer not null default 0,
  consecutive_clean_count integer not null default 0,
  attempts_count integer not null default 0,
  mastered_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, exercise_id)
);

alter table public.exercise_progress enable row level security;

drop policy if exists "exercise_progress_all_own" on public.exercise_progress;
create policy "exercise_progress_all_own" on public.exercise_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- practice_sessions — append-only: one row per completed practice attempt
-- (mirrors `AttemptRecord`). Never updated after insert except by the
-- idempotent upsert on `client_attempt_id` that recordAttempt() already
-- relies on locally. `session_date` is the local calendar date the attempt
-- belongs to, used for streak calculation cloud-side.
-- ---------------------------------------------------------------------------
create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_attempt_id text not null unique,
  exercise_id text not null,
  target_bpm integer not null,
  clean_bpm integer not null,
  maximum_bpm integer,
  accuracy integer not null,
  duration_minutes integer not null,
  perceived_difficulty integer not null default 3,
  notes text,
  result text not null,
  recommendation text not null,
  session_date date not null,
  created_at timestamptz not null default now()
);

alter table public.practice_sessions enable row level security;

drop policy if exists "practice_sessions_all_own" on public.practice_sessions;
create policy "practice_sessions_all_own" on public.practice_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists practice_sessions_user_date_idx
  on public.practice_sessions (user_id, session_date);

-- ---------------------------------------------------------------------------
-- video_progress — one row per (user, video). Mirrors `VideoStudyRecord`.
-- Video metadata itself (title, category, etc.) stays static in
-- src/data/kofiEmmaVideos.ts and is never duplicated here.
-- ---------------------------------------------------------------------------
create table if not exists public.video_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  video_id text not null,
  watched boolean not null default false,
  favorite boolean not null default false,
  noted_aspects text[] not null default '{}',
  notes text not null default '',
  watched_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, video_id)
);

alter table public.video_progress enable row level security;

drop policy if exists "video_progress_all_own" on public.video_progress;
create policy "video_progress_all_own" on public.video_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- user_achievements — one row per unlocked achievement id (e.g.
-- "first_groove", "level_0_complete", "streak_7"). Append-only.
-- ---------------------------------------------------------------------------
create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  achievement_id text not null,
  unlocked_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);

alter table public.user_achievements enable row level security;

drop policy if exists "user_achievements_all_own" on public.user_achievements;
create policy "user_achievements_all_own" on public.user_achievements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Keep `profiles.updated_at` current on every update.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists exercise_progress_set_updated_at on public.exercise_progress;
create trigger exercise_progress_set_updated_at
  before update on public.exercise_progress
  for each row execute function public.set_updated_at();

drop trigger if exists video_progress_set_updated_at on public.video_progress;
create trigger video_progress_set_updated_at
  before update on public.video_progress
  for each row execute function public.set_updated_at();
