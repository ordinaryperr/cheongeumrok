import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function read(relativePath) {
  return readFile(path.join(projectRoot, relativePath), 'utf8');
}

async function listFiles(directory, extension) {
  const entries = await readdir(path.join(projectRoot, directory), { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(relativePath, extension));
    else if (entry.name.endsWith(extension)) files.push(relativePath);
  }

  return files;
}

async function readSecuritySql() {
  const files = (await listFiles('supabase', '.sql'))
    .filter((file) => /schema|security|migration/i.test(file));
  const documents = await Promise.all(files.map(async (file) => `\n-- FILE: ${file}\n${await read(file)}`));
  return documents.join('\n').toLowerCase().replace(/\s+/g, ' ');
}

function policyBodies(sql, tableName) {
  const pattern = new RegExp(
    `create\\s+policy\\s+[^;]+?on\\s+(?:public\\.)?${tableName}\\s+for\\s+select[^;]+;`,
    'gi',
  );
  return sql.match(pattern) || [];
}

test('profile grants do not let authenticated users promote themselves to admin', async () => {
  const sql = await readSecuritySql();

  assert.match(
    sql,
    /revoke\s+update\s+on\s+(?:table\s+)?public\.profiles\s+from\s+(?:anon\s*,\s*)?authenticated/,
    'authenticated must lose the table-level profiles UPDATE grant',
  );

  const grants = sql.match(/grant\s+update\s*\(([^)]+)\)\s+on\s+(?:table\s+)?public\.profiles\s+to\s+authenticated/g) || [];
  assert.ok(grants.length > 0, 'safe editable profile columns should be granted explicitly');
  assert.ok(grants.every((grant) => !/\bis_admin\b/.test(grant)), 'is_admin must never be user-editable');
});

test('review reactions inherit the parent review visibility boundary', async () => {
  const sql = await readSecuritySql();

  for (const table of ['review_likes', 'review_comments']) {
    const policies = policyBodies(sql, table);
    assert.ok(policies.length > 0, `${table} needs an explicit SELECT policy`);
    assert.ok(
      policies.every((policy) => !/using\s*\(\s*true\s*\)/.test(policy)),
      `${table} must not expose reactions to private reviews`,
    );
    assert.ok(
      policies.some((policy) => (
        (/reviews/.test(policy) && /is_public/.test(policy) && /auth\.uid\s*\(\)/.test(policy))
        || /can_view_review\s*\(\s*review_id\s*\)/.test(policy)
      )),
      `${table} visibility must check the parent review's public/owner boundary`,
    );
  }

  assert.match(
    sql,
    /(?:function|replace\s+function)\s+public\.can_view_review\s*\([^;]+?reviews\.is_public[^;]+?reviews\.user_id\s*=\s*auth\.uid\s*\(\)/,
    'the shared reaction visibility helper must preserve public and owner access',
  );
});

test('browser roles cannot mutate the server-owned Spotify catalog', async () => {
  const sql = await readSecuritySql();

  for (const table of ['albums', 'tracks']) {
    for (const role of ['anon', 'authenticated']) {
      assert.match(
        sql,
        new RegExp(`revoke\\s+(?:insert\\s*,\\s*update\\s*,\\s*delete|all(?:\\s+privileges)?)\\s+on\\s+(?:table\\s+)?(?:public\\.${table}(?:\\s*,[^;]+)?|[^;]+,\\s*public\\.${table})\\s+from\\s+(?:[^;]+,\\s*)?${role}(?:\\s*,[^;]+)?;`),
        `${role} must not have catalog DML privileges on ${table}`,
      );
    }
  }
});

test('Spotify IDs use a strict shared validator', async () => {
  const spotifySource = await read('lib/spotify.js');
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(spotifySource).toString('base64')}`;
  const { isValidSpotifyId } = await import(moduleUrl);

  assert.equal(typeof isValidSpotifyId, 'function');
  assert.equal(isValidSpotifyId('4aawyAB9vmqN3uQ7FjRGTy'), true);
  assert.equal(isValidSpotifyId('short'), false);
  assert.equal(isValidSpotifyId('4aawyAB9vmqN3uQ7FjRGT!'), false);
  assert.equal(isValidSpotifyId('../4aawyAB9vmqN3uQ7FjRGTy'), false);
  assert.equal(isValidSpotifyId('4aawyAB9vmqN3uQ7FjRGTy?market=US'), false);
  assert.equal(isValidSpotifyId(null), false);
});

test('catalog API validates its boundary before using elevated writes', async () => {
  const route = await read('app/api/catalog/ensure/route.js');

  assert.match(route, /isValidSpotifyId/);
  assert.match(route, /\[\s*['"]album['"]\s*,\s*['"]track['"]\s*\]|type\s*!==\s*['"]album['"].*type\s*!==\s*['"]track['"]/s);
  assert.match(route, /status\s*:\s*400/);
  assert.match(route, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(route, /NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(route, /albumId/);
  assert.match(route, /trackId/);
});

test('catalog write quota is atomic and service-role only', async () => {
  const sql = await readSecuritySql();
  const route = await read('app/api/catalog/ensure/route.js');

  assert.match(sql, /function\s+public\.consume_catalog_save_quota/);
  assert.match(sql, /on\s+conflict\s*\(\s*user_id\s*\)\s+do\s+update/);
  assert.match(sql, /revoke\s+execute\s+on\s+function\s+public\.consume_catalog_save_quota[^;]+from\s+public\s*,\s*anon\s*,\s*authenticated/);
  assert.match(sql, /grant\s+execute\s+on\s+function\s+public\.consume_catalog_save_quota[^;]+to\s+service_role/);
  assert.match(route, /consume_catalog_save_quota/);
  assert.match(route, /status\s*:\s*429/);
  assert.match(route, /quotaError[\s\S]+status\s*:\s*503/);
});

test('music tags are isolated by owner', async () => {
  const sql = await readSecuritySql();
  const writeForm = await read('components/WriteReviewForm.js');

  assert.match(sql, /music_tags[\s\S]+add\s+column\s+if\s+not\s+exists\s+user_id/);
  assert.match(sql, /unique\s+index[^;]+\(\s*target_type\s*,\s*target_id\s*,\s*user_id\s*\)/);
  assert.match(sql, /user_id\s*=\s*auth\.uid\s*\(\)[^;]+user_has_review_for_music_tag/);
  assert.match(writeForm, /user_id\s*:\s*userId/);
  assert.match(writeForm, /onConflict\s*:\s*['"]target_type,target_id,user_id['"]/);

  const tagPolicies = policyBodies(sql, 'music_tags');
  assert.ok(tagPolicies.length > 0, 'music_tags needs an explicit SELECT policy');
  assert.ok(tagPolicies.every((policy) => !/using\s*\(\s*true\s*\)/.test(policy)));
  assert.ok(tagPolicies.some((policy) => /reviews\.is_public/.test(policy)));
});

test('security migration preserves existing function parameter names', async () => {
  const migration = await read('supabase/migrations/202608230001_security_ownership_and_privacy.sql');

  assert.match(migration, /user_has_review_for_music_tag\s*\(\s*target_type\s+text\s*,\s*target_id\s+uuid\s*\)/);
  assert.doesNotMatch(migration, /user_has_review_for_music_tag\s*\(\s*p_target_type/);
});

test('visit events cannot impersonate another user and have bounded payloads', async () => {
  const migration = await read('supabase/migrations/202608230001_security_ownership_and_privacy.sql');

  assert.match(migration, /auth\.uid\s*\(\)\s+is\s+null\s+and\s+user_id\s+is\s+null/);
  assert.match(migration, /auth\.uid\s*\(\)\s+is\s+not\s+null\s+and\s+user_id\s*=\s*auth\.uid\s*\(\)/);
  assert.match(migration, /octet_length\s*\(\s*metadata::text\s*\)\s*<=\s*16384/);
  assert.match(migration, /'login'\s*,\s*'signup'/);
});

test('write page renders only canonical Spotify metadata', async () => {
  const writePage = await read('app/write/page.js');

  assert.match(writePage, /getSpotifyItem\s*\(\s*\{\s*id\s*:\s*params\.spotify\s*,\s*type\s*:\s*params\.type\s*\}\s*\)/);
  assert.doesNotMatch(writePage, /coverUrl\s*:\s*params\.coverUrl/);
  assert.doesNotMatch(writePage, /title\s*:\s*params\.title/);
});
