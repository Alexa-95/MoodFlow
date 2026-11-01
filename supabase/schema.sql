create table if not exists public.custom_trackers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  tracker_type text not null default 'number'
    check (tracker_type in ('number', 'text', 'boolean')),
  unit text not null default '' check (char_length(unit) <= 12),
  scale_max numeric not null default 5 check (scale_max > 0 and scale_max <= 10000),
  created_at timestamptz not null default now()
);

alter table public.custom_trackers
  add column if not exists tracker_type text not null default 'number'
  check (tracker_type in ('number', 'text', 'boolean'));

create table if not exists public.daily_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  mood smallint check (mood between -5 and 5),
  energy smallint check (energy between 1 and 10),
  sleep numeric(4, 1) check (sleep between 0 and 24),
  custom_values jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

alter table public.daily_entries
  drop constraint if exists daily_entries_mood_check,
  drop constraint if exists daily_entries_energy_check;

alter table public.daily_entries
  add constraint daily_entries_mood_check check (mood between -5 and 5),
  add constraint daily_entries_energy_check check (energy between 1 and 10);

alter table public.custom_trackers enable row level security;
alter table public.daily_entries enable row level security;

drop policy if exists "Users manage their own custom trackers"
on public.custom_trackers;

create policy "Users manage their own custom trackers"
on public.custom_trackers for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own daily entries"
on public.daily_entries;

create policy "Users manage their own daily entries"
on public.daily_entries for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.custom_trackers to authenticated;
grant select, insert, update, delete on public.daily_entries to authenticated;
