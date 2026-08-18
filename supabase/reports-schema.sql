-- Reports table for community moderation.
-- Run in Supabase SQL Editor before enabling the report UI in production.

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
drop policy if exists "admins can read all reports" on public.reports;
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
