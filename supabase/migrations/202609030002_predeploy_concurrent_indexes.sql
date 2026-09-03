-- Foreign-key and feed indexes for the pre-deployment hardening pass.
--
-- Do not wrap this file in a transaction: CREATE INDEX CONCURRENTLY needs to
-- commit between phases. Re-running a successful file is idempotent. Concurrent
-- builds avoid blocking normal writes while the index scans existing rows.
-- If PostgreSQL reports an interrupted/INVALID index, drop that one index with
-- DROP INDEX CONCURRENTLY and rerun this file.

set lock_timeout = '5s';

create index concurrently if not exists tracks_album_id_idx
  on public.tracks (album_id);
create index concurrently if not exists reviews_public_created_at_idx
  on public.reviews (created_at desc) where is_public;
create index concurrently if not exists reviews_user_created_at_idx
  on public.reviews (user_id, created_at desc);
create index concurrently if not exists reviews_album_created_at_idx
  on public.reviews (album_id, created_at desc) where album_id is not null;
create index concurrently if not exists reviews_track_created_at_idx
  on public.reviews (track_id, created_at desc) where track_id is not null;
create index concurrently if not exists review_likes_user_id_idx
  on public.review_likes (user_id);
create index concurrently if not exists review_comments_review_created_at_idx
  on public.review_comments (review_id, created_at desc);
create index concurrently if not exists review_comments_user_id_idx
  on public.review_comments (user_id);
create index concurrently if not exists album_comments_album_created_at_idx
  on public.album_comments (album_id, created_at desc);
create index concurrently if not exists album_comments_user_id_idx
  on public.album_comments (user_id);
create index concurrently if not exists follows_following_id_idx
  on public.follows (following_id);
create index concurrently if not exists reports_reporter_created_at_idx
  on public.reports (reporter_id, created_at desc);
create index concurrently if not exists reports_created_at_idx
  on public.reports (created_at desc);
create index concurrently if not exists profiles_created_at_idx
  on public.profiles (created_at desc);
create index concurrently if not exists news_posts_published_at_idx
  on public.news_posts (published_at desc);

reset lock_timeout;
