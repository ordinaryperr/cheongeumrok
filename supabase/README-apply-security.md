# Supabase launch security checklist

Run these SQL files in Supabase SQL Editor before production launch:

1. `supabase/security-hardening.sql`
2. `supabase/reports-schema.sql` if you only want the reports table/policies

Current local check on 2026-08-18:

- `reports` table was not found through the anon client (`PGRST205`).
- This means the report UI is committed, but the Supabase SQL still needs to be applied in the project dashboard.

After running SQL, verify:

```js
await supabase.from('reports').select('id').limit(1)
```

Expected result for anonymous users can still be an RLS permission error depending on policy context, but it should no longer be `PGRST205 table not found`.
