-- 청음록 출시 전 RLS 보안 보강 SQL
-- Supabase SQL Editor에서 실행하세요.
-- 목표:
-- 1) 본인 데이터만 수정/삭제
-- 2) 관리자 전용 news 관리
-- 3) music_tags는 해당 앨범/트랙을 실제로 기록한 사용자만 작성/수정
-- 4) 좋아요/팔로우는 본인 계정으로만 수행

create table if not exists public.catalog_save_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.catalog_save_usage enable row level security;

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

revoke all on table public.catalog_save_usage from public, anon, authenticated;
grant select, insert, update, delete on table public.catalog_save_usage to service_role;
revoke execute on function public.consume_catalog_save_quota(uuid, integer, interval) from public, anon, authenticated;
grant execute on function public.consume_catalog_save_quota(uuid, integer, interval) to service_role;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = pg_catalog, public
stable
as $$
  select coalesce((select profiles.is_admin from public.profiles where profiles.id = auth.uid()), false);
$$;

create or replace function public.user_has_review_for_music_tag(target_type text, target_id uuid)
returns boolean
language sql
security definer
set search_path = pg_catalog, public
stable
as $$
  select exists (
    select 1
    from public.reviews
    where reviews.user_id = auth.uid()
      and (
        (target_type = 'album' and reviews.album_id = target_id)
        or
        (target_type = 'track' and reviews.track_id = target_id)
      )
  );
$$;

create or replace function public.can_view_review(p_review_id uuid)
returns boolean
language sql
security definer
set search_path = pg_catalog, public
stable
as $$
  select exists (
    select 1
    from public.reviews
    where reviews.id = p_review_id
      and (reviews.is_public or reviews.user_id = auth.uid() or public.is_admin())
  );
$$;

-- profiles.is_admin must never be writable through the client API.
revoke update on table public.profiles from anon, authenticated;
grant update (username, display_name, bio, avatar_url) on table public.profiles to authenticated;

-- Spotify catalog writes are performed by trusted server/service-role code.
drop policy if exists "authenticated users can insert albums" on public.albums;
drop policy if exists "authenticated users can update albums" on public.albums;
drop policy if exists "authenticated users can insert tracks" on public.tracks;
drop policy if exists "authenticated users can update tracks" on public.tracks;
revoke insert, update, delete on table public.albums from anon, authenticated;
revoke insert, update, delete on table public.tracks from anon, authenticated;

-- reviews
alter table public.reviews enable row level security;
drop policy if exists "public reviews are readable" on public.reviews;
drop policy if exists "users can insert own reviews" on public.reviews;
drop policy if exists "users can update own reviews" on public.reviews;
drop policy if exists "admins can moderate reviews" on public.reviews;
drop policy if exists "users can delete own reviews" on public.reviews;

create policy "public reviews are readable"
on public.reviews for select
using (is_public = true or auth.uid() = user_id or public.is_admin());

create policy "users can insert own reviews"
on public.reviews for insert
to authenticated
with check (auth.uid() = user_id);

create policy "users can update own reviews"
on public.reviews for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "admins can moderate reviews"
on public.reviews for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "users can delete own reviews"
on public.reviews for delete
to authenticated
using (auth.uid() = user_id or public.is_admin());

-- review likes
alter table public.review_likes enable row level security;
drop policy if exists "likes are readable" on public.review_likes;
drop policy if exists "users can like as themselves" on public.review_likes;
drop policy if exists "users can unlike as themselves" on public.review_likes;

create policy "likes are readable"
on public.review_likes for select
using (public.can_view_review(review_id));

create policy "users can like as themselves"
on public.review_likes for insert
to authenticated
with check (auth.uid() = user_id and public.can_view_review(review_id));

create policy "users can unlike as themselves"
on public.review_likes for delete
to authenticated
using (auth.uid() = user_id or public.is_admin());

-- review comments
alter table public.review_comments enable row level security;
drop policy if exists "comments are readable" on public.review_comments;
drop policy if exists "users can comment as themselves" on public.review_comments;
drop policy if exists "users can update own review comments" on public.review_comments;
drop policy if exists "users can delete own comments" on public.review_comments;

create policy "comments are readable"
on public.review_comments for select
using (public.can_view_review(review_id));

create policy "users can comment as themselves"
on public.review_comments for insert
to authenticated
with check (auth.uid() = user_id and public.can_view_review(review_id));

create policy "users can update own review comments"
on public.review_comments for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can delete own comments"
on public.review_comments for delete
to authenticated
using (auth.uid() = user_id or public.is_admin());

-- album comments
alter table public.album_comments enable row level security;
drop policy if exists "album comments are readable" on public.album_comments;
drop policy if exists "users can write album comments" on public.album_comments;
drop policy if exists "users can update own album comments" on public.album_comments;
drop policy if exists "users can delete own album comments" on public.album_comments;

create policy "album comments are readable"
on public.album_comments for select
using (true);

create policy "users can write album comments"
on public.album_comments for insert
to authenticated
with check (auth.uid() = user_id);

create policy "users can update own album comments"
on public.album_comments for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can delete own album comments"
on public.album_comments for delete
to authenticated
using (auth.uid() = user_id or public.is_admin());

-- follows
alter table public.follows enable row level security;
drop policy if exists "follows are readable" on public.follows;
drop policy if exists "users can follow as themselves" on public.follows;
drop policy if exists "users can unfollow as themselves" on public.follows;

create policy "follows are readable"
on public.follows for select
using (true);

create policy "users can follow as themselves"
on public.follows for insert
to authenticated
with check (auth.uid() = follower_id and follower_id <> following_id);

create policy "users can unfollow as themselves"
on public.follows for delete
to authenticated
using (auth.uid() = follower_id or public.is_admin());

-- profiles
alter table public.profiles enable row level security;
drop policy if exists "profiles are readable by everyone" on public.profiles;
drop policy if exists "users can update own profile" on public.profiles;

create policy "profiles are readable by everyone"
on public.profiles for select
using (true);

create policy "users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- music_tags
alter table public.music_tags add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.music_tags drop constraint if exists music_tags_target_type_target_id_key;
create unique index if not exists music_tags_target_owner_uidx
  on public.music_tags (target_type, target_id, user_id) nulls not distinct;
create index if not exists music_tags_user_id_idx on public.music_tags (user_id);
create index if not exists reviews_public_album_tag_owner_idx
  on public.reviews (user_id, album_id) where is_public and album_id is not null;
create index if not exists reviews_public_track_tag_owner_idx
  on public.reviews (user_id, track_id) where is_public and track_id is not null;

alter table public.music_tags enable row level security;
drop policy if exists "Public music tags are readable" on public.music_tags;
drop policy if exists "Authenticated users can write music tags" on public.music_tags;
drop policy if exists "Authenticated users can write music tags for reviewed targets" on public.music_tags;
drop policy if exists "Authenticated users can update music tags" on public.music_tags;
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
on public.music_tags for insert
to authenticated
with check (
  (user_id = auth.uid() and public.user_has_review_for_music_tag(target_type, target_id))
  or (public.is_admin() and user_id is null)
);

create policy "Authenticated users can update music tags for reviewed targets"
on public.music_tags for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (
  (user_id = auth.uid() and public.user_has_review_for_music_tag(target_type, target_id))
  or public.is_admin()
);

create policy "Users can delete own music tags"
on public.music_tags for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

-- user_taste_signals
alter table public.user_taste_signals enable row level security;
drop policy if exists "Users can read own taste signals" on public.user_taste_signals;
drop policy if exists "Users can write own taste signals" on public.user_taste_signals;
drop policy if exists "Users can update own taste signals" on public.user_taste_signals;
drop policy if exists "Users can delete own taste signals" on public.user_taste_signals;

create policy "Users can read own taste signals"
on public.user_taste_signals for select
using (auth.uid() = user_id or public.is_admin());

create policy "Users can write own taste signals"
on public.user_taste_signals for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own taste signals"
on public.user_taste_signals for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own taste signals"
on public.user_taste_signals for delete
to authenticated
using (auth.uid() = user_id or public.is_admin());

-- news_posts
alter table public.news_posts enable row level security;
drop policy if exists "news is readable by everyone" on public.news_posts;
drop policy if exists "authenticated users can insert news" on public.news_posts;
drop policy if exists "authenticated users can update news" on public.news_posts;
drop policy if exists "authenticated users can delete news" on public.news_posts;

create policy "news is readable by everyone"
on public.news_posts for select
using (true);

create policy "admins can insert news"
on public.news_posts for insert
to authenticated
with check (public.is_admin());

create policy "admins can update news"
on public.news_posts for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins can delete news"
on public.news_posts for delete
to authenticated
using (public.is_admin());

-- reports
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

alter table public.reports enable row level security;

drop policy if exists "users can create reports" on public.reports;
drop policy if exists "users can read own reports" on public.reports;
drop policy if exists "admins can update reports" on public.reports;

create policy "users can create reports"
on public.reports for insert
to authenticated
with check (auth.uid() = reporter_id);

create policy "users can read own reports"
on public.reports for select
to authenticated
using (auth.uid() = reporter_id or public.is_admin());

create policy "admins can update reports"
on public.reports for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
