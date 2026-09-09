import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../lib/reviews.js', import.meta.url), 'utf8');
const stub = `
export const calls = [];
const query = Object.fromEntries(['select', 'eq', 'order', 'limit'].map(method =>
  [method, (...args) => { calls.push([method, ...args]); return query; }]));
const supabase = { from: name => { calls.push(['from', name]); return query; } };
`;
const { getPublicReviews, calls } = await import('data:text/javascript;base64,' +
  Buffer.from(source.replace("import { supabase } from './supabase';", stub)).toString('base64'));

test('home query limits at the database while keeping public visibility and newest-first order', async () => {
  calls.length = 0;
  await getPublicReviews({ limit: 5 });
  assert.ok(calls.some(call => call[0] === 'eq' && call[1] === 'is_public' && call[2] === true));
  assert.deepEqual(calls.find(call => call[0] === 'order'), ['order', 'created_at', { ascending: false }]);
  assert.deepEqual(calls.at(-1), ['limit', 5]);
});

test('existing full-feed caller is not silently truncated', async () => {
  calls.length = 0;
  await getPublicReviews();
  assert.equal(calls.some(call => call[0] === 'limit'), false);
});

test('invalid limits fail before issuing a query', async () => {
  calls.length = 0;
  for (const limit of [0, -1, 1.5, '5', null, Infinity]) {
    await assert.rejects(getPublicReviews({ limit }), RangeError);
  }
  assert.equal(calls.length, 0);
});

test('home requests only the five reviews it displays', async () => {
  const home = await readFile(new URL('../app/page.js', import.meta.url), 'utf8');
  assert.match(home, /getPublicReviews\(\{ limit: 5 \}\)/);
});
