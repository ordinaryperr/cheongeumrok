import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('home preserves the YouTube intro immediately after the globe', async () => {
  const page = await readFile(new URL('../app/page.js', import.meta.url), 'utf8');
  const video = await readFile(new URL('../components/IntroVideo.js', import.meta.url), 'utf8');
  assert.match(page, /<EarthIntro\s*\/>\s*<IntroVideo\s*\/>/);
  const journey = await readFile(new URL('../components/IntroJourney.js', import.meta.url), 'utf8');
  assert.match(journey, /id="video-intro"/);
  assert.match(video, /youtube\.com\/embed/);
  assert.match(video, /handleSoundToggle/);
});

test('globe exposes reduced-motion, pause and fallback controls', async () => {
  const intro = await readFile(new URL('../components/EarthIntro.js', import.meta.url), 'utf8');
  assert.match(intro, /prefers-reduced-motion: reduce/);
  assert.match(intro, /aria-pressed=\{paused\}/);
  assert.match(intro, /href="#video-intro"/);
  assert.match(intro, /earthFallback/);
});
