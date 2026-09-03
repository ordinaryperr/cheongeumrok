import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function read(relativePath) {
  return readFile(path.join(projectRoot, relativePath), 'utf8');
}

test('release scripts gate deployment on test, lint, build, and production audit', async () => {
  const packageJson = JSON.parse(await read('package.json'));

  assert.equal(packageJson.scripts.check, 'npm test && npm run lint && npm run build');
  assert.match(packageJson.scripts['audit:prod'], /npm audit --omit=dev --audit-level=high/);
  assert.match(packageJson.scripts.predeploy, /npm run check/);
  assert.match(packageJson.scripts.predeploy, /npm run audit:prod/);
  assert.equal(packageJson.engines.node, '^22.13.0 || ^24.0.0');
});

test('example environment file documents placeholders without committing secrets', async () => {
  const envExample = await read('.env.example');
  const requiredKeys = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SPOTIFY_CLIENT_ID',
    'SPOTIFY_CLIENT_SECRET',
  ];

  for (const key of requiredKeys) {
    assert.match(envExample, new RegExp(`^${key}=.+$`, 'm'), `${key} needs a documented placeholder`);
  }

  assert.doesNotMatch(envExample, /^SUPABASE_SERVICE_ROLE_KEY=sb_secret_/m);
  assert.doesNotMatch(envExample, /^SPOTIFY_CLIENT_SECRET=(?!your-).+/m);
  assert.doesNotMatch(envExample, /NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/);
});

test('Next.js applies baseline response hardening', async () => {
  const config = await read('next.config.mjs');

  assert.match(config, /poweredByHeader:\s*false/);
  assert.match(config, /X-Content-Type-Options/);
  assert.match(config, /X-Frame-Options/);
  assert.match(config, /Referrer-Policy/);
  assert.match(config, /Permissions-Policy/);
  assert.match(config, /Strict-Transport-Security/);
});

test('search context follows the submitted query instead of unsubmitted input', async () => {
  const searchClient = await read('components/SearchClient.js');

  assert.match(searchClient, /\[submittedQuery,\s*setSubmittedQuery\]\s*=\s*useState/);
  assert.match(searchClient, /setSubmittedQuery\(keyword\)/);
  assert.match(
    searchClient,
    /useMemo\(\(\)\s*=>\s*findSearchContext\(submittedQuery\),\s*\[submittedQuery\]\)/,
  );
  assert.doesNotMatch(
    searchClient,
    /useMemo\(\(\)\s*=>\s*findSearchContext\(query\),\s*\[query\]\)/,
  );
});
