-- Pre-deployment database hardening.
--
-- This follows the already-applied 202608230001 migration. It is intentionally
-- idempotent: every policy is replaced by name, privileges are reset to a
-- documented allow-list, and indexes use IF NOT EXISTS.

begin;

-- Do not wait indefinitely for DDL locks during a production migration.
set local lock_timeout = '5s';
set local statement_timeout = '2min';

-- Trigger helpers and RLS helpers must not resolve attacker-controlled objects.
-- Trigger functions do not need to be directly executable by API roles.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_display_name text := nullif(
    pg_catalog.split_part(coalesce(new.email, ''), '@', 1),
    ''
  );
begin
  -- Email local-parts are not globally unique (a@one.test and a@two.test).
  -- A deterministic UUID suffix prevents an unrelated account from blocking
  -- signup through the profiles.username unique constraint.
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(v_display_name, 'listener') || '-' ||
      pg_catalog.left(pg_catalog.replace(new.id::text, '-', ''), 12),
    coalesce(v_display_name, 'listener')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(
    (
      select profiles.is_admin
      from public.profiles
      where profiles.id = (select auth.uid())
    ),
    false
  );
$$;

create or replace function public.can_view_review(p_review_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.reviews
    where reviews.id = p_review_id
      and (
        reviews.is_public
        or reviews.user_id = (select auth.uid())
        or (select public.is_admin())
      )
  );
$$;

create or replace function public.user_has_review_for_music_tag(
  target_type text,
  target_id uuid
)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.reviews
    where reviews.user_id = (select auth.uid())
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
set search_path = ''
as $$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_allowed boolean := false;
begin
  if p_user_id is null or p_limit is null or p_limit < 1 or p_limit > 1000
     or p_window is null or p_window <= interval '0 seconds'
     or p_window > interval '1 day' then
    return false;
  end if;

  insert into public.catalog_save_usage (
    user_id,
    window_started_at,
    request_count,
    updated_at
  )
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

create or replace function public.validate_report_target()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target_exists boolean := false;
begin
  case new.target_type
    when 'review' then
      v_target_exists := public.can_view_review(new.target_id);
    when 'review_comment' then
      select exists (
        select 1
        from public.review_comments
        where review_comments.id = new.target_id
          and public.can_view_review(review_comments.review_id)
      ) into v_target_exists;
    when 'album_comment' then
      select exists (
        select 1
        from public.album_comments
        where album_comments.id = new.target_id
      ) into v_target_exists;
    when 'profile' then
      select exists (
        select 1
        from public.profiles
        where profiles.id = new.target_id
      ) into v_target_exists;
  end case;

  if not coalesce(v_target_exists, false) then
    raise exception using
      errcode = '23503',
      message = 'report target does not exist or is not visible';
  end if;

  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.is_admin() from public, anon, authenticated;
revoke all on function public.can_view_review(uuid) from public, anon, authenticated;
revoke all on function public.user_has_review_for_music_tag(text, uuid) from public, anon, authenticated;
revoke all on function public.consume_catalog_save_quota(uuid, integer, interval) from public, anon, authenticated;
revoke all on function public.validate_report_target() from public, anon, authenticated;

grant execute on function public.is_admin() to anon, authenticated, service_role;
grant execute on function public.can_view_review(uuid) to anon, authenticated, service_role;
grant execute on function public.user_has_review_for_music_tag(text, uuid) to authenticated, service_role;
grant execute on function public.consume_catalog_save_quota(uuid, integer, interval) to service_role;

drop trigger if exists reports_validate_target on public.reports;
create trigger reports_validate_target
  before insert on public.reports
  for each row execute function public.validate_report_target();

-- A NOT VALID check avoids scanning/locking existing report rows while still
-- rejecting empty or unbounded reasons on every new insert and update.
do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid = 'public.reports'::regclass
      and conname = 'reports_reason_length_check'
  ) then
    alter table public.reports
      add constraint reports_reason_length_check
      check (
        pg_catalog.char_length(reason) between 1 and 2000
        and reason ~ '[^[:space:]]'
      )
      not valid;
  end if;
end
$$;

-- Explicit API-role privileges prevent future default-grant changes from
-- exposing operations that have no product use. RLS remains the row filter.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to anon, authenticated;
grant update (username, display_name, bio, avatar_url) on table public.profiles to authenticated;

revoke all on table public.albums, public.tracks from anon, authenticated;
grant select on table public.albums, public.tracks to anon, authenticated;

revoke all on table public.reviews from anon, authenticated;
grant select on table public.reviews to anon, authenticated;
grant insert, update, delete on table public.reviews to authenticated;

revoke all on table public.review_likes from anon, authenticated;
grant select on table public.review_likes to anon, authenticated;
grant insert, delete on table public.review_likes to authenticated;

revoke all on table public.review_comments from anon, authenticated;
grant select on table public.review_comments to anon, authenticated;
grant insert, update, delete on table public.review_comments to authenticated;

revoke all on table public.album_comments from anon, authenticated;
grant select on table public.album_comments to anon, authenticated;
grant insert, update, delete on table public.album_comments to authenticated;

revoke all on table public.follows from anon, authenticated;
grant select on table public.follows to anon, authenticated;
grant insert, delete on table public.follows to authenticated;

revoke all on table public.news_posts from anon, authenticated;
grant select on table public.news_posts to anon, authenticated;
grant insert, update, delete on table public.news_posts to authenticated;

revoke all on table public.music_tags from anon, authenticated;
grant select on table public.music_tags to anon, authenticated;
grant insert, update, delete on table public.music_tags to authenticated;

revoke all on table public.user_taste_signals from anon, authenticated;
grant select, insert, update, delete on table public.user_taste_signals to authenticated;

revoke all on table public.reports from anon, authenticated;
grant select, insert, update on table public.reports to authenticated;

revoke all on table public.visit_events from anon, authenticated;
grant insert on table public.visit_events to anon, authenticated;
grant select on table public.visit_events to authenticated;

revoke all on table public.catalog_save_usage from public, anon, authenticated;
grant select, insert, update, delete on table public.catalog_save_usage to service_role;

-- AdminDashboard changes review visibility. The owner policy does not permit
-- an admin to moderate another user's row, so add the missing admin policy.
drop policy if exists "admins can moderate reviews" on public.reviews;
create policy "admins can moderate reviews"
  on public.reviews for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Replace the most frequently evaluated policies with init-plan-friendly
-- auth/RLS helper calls. Wrapping stable functions in SELECT evaluates them
-- once per statement instead of once per candidate row.
drop policy if exists "public reviews are readable" on public.reviews;
create policy "public reviews are readable"
  on public.reviews for select
  using (is_public or (select auth.uid()) = user_id or (select public.is_admin()));

drop policy if exists "users can insert own reviews" on public.reviews;
create policy "users can insert own reviews"
  on public.reviews for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "users can update own reviews" on public.reviews;
create policy "users can update own reviews"
  on public.reviews for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "users can delete own reviews" on public.reviews;
create policy "users can delete own reviews"
  on public.reviews for delete to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));

drop policy if exists "clients can create visit events" on public.visit_events;
create policy "clients can create visit events"
  on public.visit_events for insert
  with check (
    ((select auth.uid()) is null and user_id is null)
    or ((select auth.uid()) is not null and user_id = (select auth.uid()))
  );

drop policy if exists "admins can read visit events" on public.visit_events;
create policy "admins can read visit events"
  on public.visit_events for select to authenticated
  using ((select public.is_admin()));

commit;
