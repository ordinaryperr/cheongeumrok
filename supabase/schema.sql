-- 청음록 MVP DB Schema
-- Supabase SQL Editor에 전체 복붙 후 실행

create extension if not exists pgcrypto;

-- 1. 프로필
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  bio text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
add column if not exists is_admin boolean not null default false;

-- 2. 앨범 캐시: Spotify API에서 가져온 앨범 정보를 저장
create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  spotify_id text unique,
  title text not null,
  artist text not null,
  cover_url text,
  release_date text,
  album_type text,
  external_url text,
  created_at timestamptz not null default now()
);

-- 3. 트랙 캐시
create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  spotify_id text unique,
  album_id uuid references public.albums(id) on delete set null,
  title text not null,
  artist text not null,
  duration_ms integer,
  track_number integer,
  external_url text,
  created_at timestamptz not null default now()
);

-- 4. 리뷰: 앨범 또는 트랙 중 하나에 연결
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  album_id uuid references public.albums(id) on delete cascade,
  track_id uuid references public.tracks(id) on delete cascade,
  rating numeric(2,1) not null check (rating >= 0.5 and rating <= 5.0),
  one_liner text,
  body text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint review_target_check check (
    (album_id is not null and track_id is null) or
    (album_id is null and track_id is not null)
  )
);

-- 5. 좋아요
create table if not exists public.review_likes (
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

-- 6. 댓글
create table if not exists public.review_comments (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- 7. 팔로우
create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);

-- 8. 앨범 댓글
create table if not exists public.album_comments (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. 뉴스/에디터 글: 초반에는 직접 입력용
create table if not exists public.news_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  body text,
  source text,
  source_url text,
  category text,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- updated_at 자동 갱신 함수
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

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

drop trigger if exists album_comments_set_updated_at on public.album_comments;
create trigger album_comments_set_updated_at
before update on public.album_comments
for each row execute function public.set_updated_at();

-- 회원가입 시 profiles 자동 생성
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    split_part(new.email, '@', 1),
    split_part(new.email, '@', 1)
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS 활성화
alter table public.profiles enable row level security;
alter table public.albums enable row level security;
alter table public.tracks enable row level security;
alter table public.reviews enable row level security;
alter table public.review_likes enable row level security;
alter table public.review_comments enable row level security;
alter table public.album_comments enable row level security;
alter table public.follows enable row level security;
alter table public.news_posts enable row level security;

-- 기존 정책 제거: SQL을 다시 실행해도 충돌하지 않게 처리
drop policy if exists "profiles are readable by everyone" on public.profiles;
drop policy if exists "users can update own profile" on public.profiles;
drop policy if exists "albums are readable by everyone" on public.albums;
drop policy if exists "authenticated users can insert albums" on public.albums;
drop policy if exists "authenticated users can update albums" on public.albums;
drop policy if exists "tracks are readable by everyone" on public.tracks;
drop policy if exists "authenticated users can insert tracks" on public.tracks;
drop policy if exists "authenticated users can update tracks" on public.tracks;
drop policy if exists "public reviews are readable" on public.reviews;
drop policy if exists "users can insert own reviews" on public.reviews;
drop policy if exists "users can update own reviews" on public.reviews;
drop policy if exists "users can delete own reviews" on public.reviews;
drop policy if exists "likes are readable" on public.review_likes;
drop policy if exists "users can like as themselves" on public.review_likes;
drop policy if exists "users can unlike as themselves" on public.review_likes;
drop policy if exists "comments are readable" on public.review_comments;
drop policy if exists "users can comment as themselves" on public.review_comments;
drop policy if exists "users can delete own comments" on public.review_comments;
drop policy if exists "album comments are readable" on public.album_comments;
drop policy if exists "users can write album comments" on public.album_comments;
drop policy if exists "users can update own album comments" on public.album_comments;
drop policy if exists "users can delete own album comments" on public.album_comments;
drop policy if exists "follows are readable" on public.follows;
drop policy if exists "users can follow as themselves" on public.follows;
drop policy if exists "users can unfollow as themselves" on public.follows;
drop policy if exists "news is readable by everyone" on public.news_posts;
drop policy if exists "authenticated users can insert news" on public.news_posts;
drop policy if exists "authenticated users can update news" on public.news_posts;
drop policy if exists "authenticated users can delete news" on public.news_posts;

-- profiles policies
create policy "profiles are readable by everyone"
on public.profiles for select using (true);

create policy "users can update own profile"
on public.profiles for update using (auth.uid() = id);

-- albums/tracks: 모두 읽기 가능, 로그인 유저가 캐시 생성 가능
create policy "albums are readable by everyone"
on public.albums for select using (true);

create policy "authenticated users can insert albums"
on public.albums for insert with check (auth.role() = 'authenticated');

create policy "authenticated users can update albums"
on public.albums for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "tracks are readable by everyone"
on public.tracks for select using (true);

create policy "authenticated users can insert tracks"
on public.tracks for insert with check (auth.role() = 'authenticated');

create policy "authenticated users can update tracks"
on public.tracks for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- reviews policies
create policy "public reviews are readable"
on public.reviews for select using (is_public = true or auth.uid() = user_id);

create policy "users can insert own reviews"
on public.reviews for insert with check (auth.uid() = user_id);

create policy "users can update own reviews"
on public.reviews for update using (auth.uid() = user_id);

create policy "users can delete own reviews"
on public.reviews for delete using (auth.uid() = user_id);

-- likes policies
create policy "likes are readable"
on public.review_likes for select using (true);

create policy "users can like as themselves"
on public.review_likes for insert with check (auth.uid() = user_id);

create policy "users can unlike as themselves"
on public.review_likes for delete using (auth.uid() = user_id);

-- comments policies
create policy "comments are readable"
on public.review_comments for select using (true);

create policy "users can comment as themselves"
on public.review_comments for insert with check (auth.uid() = user_id);

create policy "users can delete own comments"
on public.review_comments for delete using (auth.uid() = user_id);

-- album comments policies
create policy "album comments are readable"
on public.album_comments for select using (true);

create policy "users can write album comments"
on public.album_comments for insert with check (auth.uid() = user_id);

create policy "users can update own album comments"
on public.album_comments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users can delete own album comments"
on public.album_comments for delete using (auth.uid() = user_id);

-- follows policies
create policy "follows are readable"
on public.follows for select using (true);

create policy "users can follow as themselves"
on public.follows for insert with check (auth.uid() = follower_id);

create policy "users can unfollow as themselves"
on public.follows for delete using (auth.uid() = follower_id);

-- news policies
create policy "news is readable by everyone"
on public.news_posts for select using (true);

create policy "authenticated users can insert news"
on public.news_posts for insert with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.is_admin = true
  )
);

create policy "authenticated users can update news"
on public.news_posts for update using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.is_admin = true
  )
) with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.is_admin = true
  )
);

create policy "authenticated users can delete news"
on public.news_posts for delete using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.is_admin = true
  )
);

-- MVP용 샘플 뉴스
insert into public.news_posts (title, summary, source, category)
values
  ('이번 주 새로 나온 앨범들', '인디 록, 재즈, 앰비언트 중심으로 이번 주 주목할 만한 신보를 모았습니다.', '청음록 편집부', 'New Release'),
  ('다시 커지는 바이닐 시장', '소장과 감상의 경계에서 바이닐 문화가 어떤 방식으로 확장되고 있는지 살펴봅니다.', 'Music Desk', 'Scene')
on conflict do nothing;
