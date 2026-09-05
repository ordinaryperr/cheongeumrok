-- Security ownership and privacy hardening.
-- Apply after supabase/schema.sql. This migration creates optional tables it
-- depends on, so it is safe whether or not the legacy optional SQL files ran.

begin;

create extension if not exists pgcrypto;

create table if not exists public.music_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('album', 'track')),
  target_id uuid not null,
  genre text,
  mood text,
  texture text,
  era text,
  difficulty text check (difficulty in ('Freshman', 'Sophomore', 'Junior', 'Senior')),
  adjacent_genres text[] default '{}',
  created_at timestamptz default now()
);

alter table public.music_tags
  add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.music_tags
  drop constraint if exists music_tags_target_type_target_id_key;
create unique index if not exists music_tags_target_owner_uidx
  on public.music_tags (target_type, target_id, user_id) nulls not distinct;
create index if not exists music_tags_user_id_idx on public.music_tags (user_id);
create index if not exists reviews_public_album_tag_owner_idx
  on public.reviews (user_id, album_id) where is_public and album_id is not null;
create index if not exists reviews_public_track_tag_owner_idx
  on public.reviews (user_id, track_id) where is_public and track_id is not null;

create table if not exists public.user_taste_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dimension text not null check (dimension in ('genre', 'mood', 'texture', 'era', 'difficulty', 'adjacentGenres')),
  value text not null,
  score numeric not null default 0,
  updated_at timestamptz default now(),
  unique (user_id, dimension, value)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('review', 'review_comment', 'album_comment', 'profile')),
  target_id uuid not null,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed', 'resolved')),
  created_at timestamptz not null default now(),
  unique (target_type, target_id, reporter_id)
);

create table if not exists public.visit_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id text,
  path text,
  referrer text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.catalog_save_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.catalog_save_usage enable row level security;

create index if not exists visit_events_created_at_idx on public.visit_events (created_at desc);
create index if not exists visit_events_event_type_idx on public.visit_events (event_type);
create index if not exists visit_events_user_id_idx on public.visit_events (user_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.visit_events'::regclass
      and conname = 'visit_events_payload_size_check'
  ) then
    alter table public.visit_events
      add constraint visit_events_payload_size_check check (
        event_type = any (array[
          'page_view', 'review_created', 'review_liked', 'review_unliked',
          'comment_created', 'report_created', 'share_clicked', 'login', 'signup'
        ]::text[])
        and (anonymous_id is null or char_length(anonymous_id) <= 128)
        and (path is null or char_length(path) <= 2048)
        and (referrer is null or char_length(referrer) <= 2048)
        and (user_agent is null or char_length(user_agent) <= 512)
        and octet_length(metadata::text) <= 16384
      ) not valid;
  end if;
end
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = pg_catalog, public
stable
as $$
  select coalesce((select profiles.is_admin from public.profiles where profiles.id = auth.uid()), false);
$$;

create or replace function public.can_view_review(p_review_id uuid)
returns boolean
language sql
security definer
set search_path = pg_catalog, public
stable
as $$
  select exists (
    select 1 from public.reviews
    where reviews.id = p_review_id
      and (reviews.is_public or reviews.user_id = auth.uid() or public.is_admin())
  );
$$;

create or replace function public.user_has_review_for_music_tag(target_type text, target_id uuid)
returns boolean
language sql
security definer
set search_path = pg_catalog, public
stable
as $$
  select exists (
    select 1 from public.reviews
    where reviews.user_id = auth.uid()
      and (
        (target_type = 'album' and reviews.album_id = target_id)
        or (target_type = 'track' and reviews.track_id = target_id)
      )
  );
$$;

create or replace function public.consume_catalog_save_quota(
  p_user_id uuid,
  p_limit integer,
  p_window interval
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_allowed boolean := false;
begin
  if p_user_id is null or p_limit is null or p_limit < 1 or p_limit > 1000
     or p_window is null or p_window <= interval '0 seconds' or p_window > interval '1 day' then
    return false;
  end if;

  insert into public.catalog_save_usage (user_id, window_started_at, request_count, updated_at)
  values (p_user_id, v_now, 1, v_now)
  on conflict (user_id) do update
  set window_started_at = case
        when public.catalog_save_usage.window_started_at + p_window <= v_now then v_now
        else public.catalog_save_usage.window_started_at
      end,
      request_count = case
        when public.catalog_save_usage.window_started_at + p_window <= v_now then 1
        else public.catalog_save_usage.request_count + 1
      end,
      updated_at = v_now
  where public.catalog_save_usage.window_started_at + p_window <= v_now
     or public.catalog_save_usage.request_count < p_limit
  returning true into v_allowed;

  return coalesce(v_allowed, false);
end;
$$;

-- Trigger helpers run with a fixed lookup path. The auth trigger keeps working
-- after direct RPC execution is removed from browser roles.
alter function public.set_updated_at() set search_path = pg_catalog, public;
alter function public.handle_new_user() set search_path = pg_catalog, public;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

revoke all on table public.catalog_save_usage from public, anon, authenticated;
grant select, insert, update, delete on table public.catalog_save_usage to service_role;
revoke execute on function public.consume_catalog_save_quota(uuid, integer, interval) from public, anon, authenticated;
grant execute on function public.consume_catalog_save_quota(uuid, integer, interval) to service_role;

-- A row policy does not restrict which columns an owner can change.
revoke update on table public.profiles from anon, authenticated;
grant update (username, display_name, bio, avatar_url) on table public.profiles to authenticated;

drop policy if exists "authenticated users can insert albums" on public.albums;
drop policy if exists "authenticated users can update albums" on public.albums;
drop policy if exists "authenticated users can insert tracks" on public.tracks;
drop policy if exists "authenticated users can update tracks" on public.tracks;
revoke insert, update, delete on table public.albums from anon, authenticated;
revoke insert, update, delete on table public.tracks from anon, authenticated;

alter table public.review_likes enable row level security;
drop policy if exists "likes are readable" on public.review_likes;
drop policy if exists "users can like as themselves" on public.review_likes;
create policy "likes are readable"
  on public.review_likes for select
  using (public.can_view_review(review_id));
create policy "users can like as themselves"
  on public.review_likes for insert to authenticated
  with check (auth.uid() = user_id and public.can_view_review(review_id));

alter table public.review_comments enable row level security;
drop policy if exists "comments are readable" on public.review_comments;
drop policy if exists "users can comment as themselves" on public.review_comments;
create policy "comments are readable"
  on public.review_comments for select
  using (public.can_view_review(review_id));
create policy "users can comment as themselves"
  on public.review_comments for insert to authenticated
  with check (auth.uid() = user_id and public.can_view_review(review_id));

alter table public.music_tags enable row level security;
drop policy if exists "Public music tags are readable" on public.music_tags;
drop policy if exists "Authenticated users can write music tags" on public.music_tags;
drop policy if exists "Authenticated users can update music tags" on public.music_tags;
drop policy if exists "Authenticated users can write music tags for reviewed targets" on public.music_tags;
drop policy if exists "Authenticated users can update music tags for reviewed targets" on public.music_tags;
drop policy if exists "Admins can delete music tags" on public.music_tags;
drop policy if exists "Users can delete own music tags" on public.music_tags;
create policy "Public music tags are readable"
  on public.music_tags for select
  using (
    user_id is null
    or user_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.reviews
      where reviews.user_id = music_tags.user_id
        and reviews.is_public
        and (
          (music_tags.target_type = 'album' and reviews.album_id = music_tags.target_id)
          or (music_tags.target_type = 'track' and reviews.track_id = music_tags.target_id)
        )
    )
  );
create policy "Authenticated users can write music tags for reviewed targets"
  on public.music_tags for insert to authenticated
  with check (
    (user_id = auth.uid() and public.user_has_review_for_music_tag(target_type, target_id))
    or (public.is_admin() and user_id is null)
  );
create policy "Authenticated users can update music tags for reviewed targets"
  on public.music_tags for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (
    (user_id = auth.uid() and public.user_has_review_for_music_tag(target_type, target_id))
    or public.is_admin()
  );
create policy "Users can delete own music tags"
  on public.music_tags for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

alter table public.user_taste_signals enable row level security;
drop policy if exists "Users can read own taste signals" on public.user_taste_signals;
drop policy if exists "Users can write own taste signals" on public.user_taste_signals;
drop policy if exists "Users can update own taste signals" on public.user_taste_signals;
drop policy if exists "Users can delete own taste signals" on public.user_taste_signals;
create policy "Users can read own taste signals"
  on public.user_taste_signals for select
  using (auth.uid() = user_id or public.is_admin());
create policy "Users can write own taste signals"
  on public.user_taste_signals for insert to authenticated
  with check (auth.uid() = user_id);
create policy "Users can update own taste signals"
  on public.user_taste_signals for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own taste signals"
  on public.user_taste_signals for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());

alter table public.reports enable row level security;
drop policy if exists "users can create reports" on public.reports;
drop policy if exists "users can read own reports" on public.reports;
drop policy if exists "admins can update reports" on public.reports;
create policy "users can create reports"
  on public.reports for insert to authenticated
  with check (auth.uid() = reporter_id);
create policy "users can read own reports"
  on public.reports for select to authenticated
  using (auth.uid() = reporter_id or public.is_admin());
create policy "admins can update reports"
  on public.reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

alter table public.visit_events enable row level security;
drop policy if exists "clients can create visit events" on public.visit_events;
drop policy if exists "admins can read visit events" on public.visit_events;
create policy "clients can create visit events"
  on public.visit_events for insert
  with check (
    (auth.uid() is null and user_id is null)
    or (auth.uid() is not null and user_id = auth.uid())
  );
create policy "admins can read visit events"
  on public.visit_events for select to authenticated
  using (public.is_admin());

commit;
