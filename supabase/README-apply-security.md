# Supabase launch security checklist

Run the versioned migration after the base schema before production launch:

1. `supabase/schema.sql` for a new project only
2. `supabase/migrations/202608230001_security_ownership_and_privacy.sql`
3. `supabase/migrations/202609030001_predeploy_database_hardening.sql`
4. `supabase/migrations/202609030002_predeploy_concurrent_indexes.sql`

The first migration creates the optional ontology, reports, and visit-event
tables when they are missing. The follow-up migration locks down function and
table privileges and adds the missing moderation policy. It uses a short,
atomic transaction with a five-second DDL lock timeout, so a busy database
fails safely instead of waiting indefinitely; retry it during a quieter window
if that happens. The final migration adds FK/feed indexes concurrently and must
not be wrapped in a transaction. Re-running it after success is safe. If an
index build is interrupted, use the invalid-index query below; drop only the
reported invalid index with `drop index concurrently`, then rerun the file. The legacy
`ontology-schema.sql`, `reports-schema.sql`, `visit-events-schema.sql`, and
`security-hardening.sql` files remain available for targeted/manual recovery,
but should not be used as the production migration sequence.

The trusted catalog API must consume its database quota before calling Spotify
or writing cache rows:

```js
const { data: allowed, error } = await serviceClient.rpc('consume_catalog_save_quota', {
  p_user_id: user.id,
  p_limit: 30,
  p_window: '1 hour',
});
```

Proceed only when `error` is null and `allowed === true`. The RPC and its usage
table are inaccessible to `anon` and `authenticated`; do not expose the service
role key to the browser.

After running SQL, verify:

```sql
-- All SECURITY DEFINER functions should have a fixed empty search_path.
select p.proname, p.prosecdef, p.proconfig
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'is_admin',
    'can_view_review',
    'user_has_review_for_music_tag',
    'consume_catalog_save_quota',
    'handle_new_user',
    'validate_report_target'
  )
order by p.proname;

-- The admin review-update policy and pre-deployment indexes must exist.
select policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename = 'reviews'
order by policyname;

-- Expected: false, false, false, false.
select
  has_column_privilege('authenticated', 'public.profiles', 'is_admin', 'UPDATE')
    as user_can_promote_self,
  has_table_privilege('authenticated', 'public.albums', 'INSERT')
    as user_can_write_albums,
  has_table_privilege('anon', 'public.reports', 'INSERT')
    as anon_can_report,
  has_function_privilege(
    'authenticated',
    'public.consume_catalog_save_quota(uuid,integer,interval)',
    'EXECUTE'
  ) as user_can_consume_server_quota;

select indexname
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'reviews_public_created_at_idx',
    'reviews_user_created_at_idx',
    'review_comments_review_created_at_idx',
    'album_comments_album_created_at_idx',
    'follows_following_id_idx'
  )
order by indexname;

-- Must return zero rows. An interrupted concurrent build can leave an invalid
-- index that CREATE INDEX IF NOT EXISTS intentionally will not replace.
select n.nspname as schema_name, c.relname as index_name
from pg_catalog.pg_index i
join pg_catalog.pg_class c on c.oid = i.indexrelid
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and not i.indisvalid;
```

Finally, test with separate anonymous, normal-user, and admin sessions. Anonymous
users must only read public content and insert anonymous visit events; normal
users must not update `profiles.is_admin`, catalog tables, reports owned by
others, or private-review reactions; admins must be able to moderate review
visibility and report status.
