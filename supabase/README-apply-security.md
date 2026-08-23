# Supabase launch security checklist

Run the versioned migration after the base schema before production launch:

1. `supabase/schema.sql` for a new project only
2. `supabase/migrations/202608230001_security_ownership_and_privacy.sql`

The migration creates the optional ontology, reports, and visit-event tables when
they are missing, then applies the policies in one transaction. The legacy
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

Current local check on 2026-08-18:

- `reports` table was not found through the anon client (`PGRST205`).
- This means the report UI is committed, but the Supabase SQL still needs to be applied in the project dashboard.

After running SQL, verify:

```js
await supabase.from('reports').select('id').limit(1)
```

Expected result for anonymous users can still be an RLS permission error depending on policy context, but it should no longer be `PGRST205 table not found`.
