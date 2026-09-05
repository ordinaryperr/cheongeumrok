-- 청음록 방문/행동 이벤트 로그
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
on public.visit_events for select
to authenticated
using (public.is_admin());
