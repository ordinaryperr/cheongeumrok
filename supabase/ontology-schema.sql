-- Optional normalized schema for the next ontology phase.
-- The current app stores ontology tags in review.body for compatibility.
-- Run this in Supabase SQL editor when you want normalized querying.

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

create policy "Public music tags are readable"
  on public.music_tags for select
  using (true);

create policy "Users can read own taste signals"
  on public.user_taste_signals for select
  using (auth.uid() = user_id);
