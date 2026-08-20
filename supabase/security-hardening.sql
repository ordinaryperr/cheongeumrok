-- 청음록 출시 전 RLS 보안 보강 SQL
-- Supabase SQL Editor에서 실행하세요.
-- 목표:
-- 1) 본인 데이터만 수정/삭제
-- 2) 관리자 전용 news 관리
-- 3) music_tags는 해당 앨범/트랙을 실제로 기록한 사용자만 작성/수정
-- 4) 좋아요/팔로우는 본인 계정으로만 수행

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select profiles.is_admin from public.profiles where profiles.id = auth.uid()), false);
$$;

create or replace function public.user_has_review_for_music_tag(target_type text, target_id uuid)
returns boolean
language sql
security definer
set search_path = public
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
using (true);

create policy "users can like as themselves"
on public.review_likes for insert
to authenticated
with check (auth.uid() = user_id);

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
using (true);

create policy "users can comment as themselves"
on public.review_comments for insert
to authenticated
with check (auth.uid() = user_id);

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
alter table public.music_tags enable row level security;
drop policy if exists "Public music tags are readable" on public.music_tags;
drop policy if exists "Authenticated users can write music tags" on public.music_tags;
drop policy if exists "Authenticated users can write music tags for reviewed targets" on public.music_tags;
drop policy if exists "Authenticated users can update music tags" on public.music_tags;
drop policy if exists "Authenticated users can update music tags for reviewed targets" on public.music_tags;
drop policy if exists "Admins can delete music tags" on public.music_tags;

create policy "Public music tags are readable"
on public.music_tags for select
using (true);

create policy "Authenticated users can write music tags for reviewed targets"
on public.music_tags for insert
to authenticated
with check (public.user_has_review_for_music_tag(target_type, target_id) or public.is_admin());

create policy "Authenticated users can update music tags for reviewed targets"
on public.music_tags for update
to authenticated
using (public.user_has_review_for_music_tag(target_type, target_id) or public.is_admin())
with check (public.user_has_review_for_music_tag(target_type, target_id) or public.is_admin());

create policy "Admins can delete music tags"
on public.music_tags for delete
to authenticated
using (public.is_admin());

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
