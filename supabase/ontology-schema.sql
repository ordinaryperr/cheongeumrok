-- Optional normalized schema for the next ontology phase.
-- Run this in Supabase SQL editor to store ontology tags in dedicated tables.
-- The app still keeps tags in review.body as a compatibility fallback.

create table if not exists public.music_tags (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('album', 'track')),
  target_id uuid not null,
  genre text,
  mood text,
  texture text,
  era text,
  difficulty text check (difficulty in ('Freshman', 'Sophomore', 'Junior', 'Senior')),
  adjacent_genres text[] default '{}',
  created_at timestamptz default now(),
  unique (target_type, target_id)
);

create table if not exists public.user_taste_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dimension text not null check (dimension in ('genre', 'mood', 'texture', 'era', 'difficulty', 'adjacentGenres')),
  value text not null,
  score numeric not null default 0,
  updated_at timestamptz default now(),
  unique (user_id, dimension, value)
);

alter table public.music_tags enable row level security;
alter table public.user_taste_signals enable row level security;

drop policy if exists "Public music tags are readable" on public.music_tags;
drop policy if exists "Authenticated users can write music tags" on public.music_tags;
drop policy if exists "Authenticated users can update music tags" on public.music_tags;
drop policy if exists "Users can read own taste signals" on public.user_taste_signals;
drop policy if exists "Users can write own taste signals" on public.user_taste_signals;
drop policy if exists "Users can update own taste signals" on public.user_taste_signals;

create policy "Public music tags are readable"
  on public.music_tags for select
  using (true);

create policy "Authenticated users can write music tags"
  on public.music_tags for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update music tags"
  on public.music_tags for update
  to authenticated
  using (true)
  with check (true);

create policy "Users can read own taste signals"
  on public.user_taste_signals for select
  using (auth.uid() = user_id);

create policy "Users can write own taste signals"
  on public.user_taste_signals for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own taste signals"
  on public.user_taste_signals for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
