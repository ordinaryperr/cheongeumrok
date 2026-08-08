import { genreGraph, ontologyKeywordMap } from '../data/musicOntology';

export function inferEra(yearOrDate) {
  const year = Number(String(yearOrDate || '').slice(0, 4));
  if (!year) return null;
  return `${Math.floor(year / 10) * 10}s`;
}

export function parseOntologyTags(body = '') {
  const match = String(body).match(/청음 태그:\s*([^\n]+)/);
  if (!match) return {};

  return match[1].split(';').reduce((acc, part) => {
    const [rawKey, ...rest] = part.trim().split('=');
    const key = rawKey?.trim();
    const value = rest.join('=').trim();
    if (!key || !value) return acc;
    acc[key] = key === 'adjacentGenres'
      ? value.split(',').map((item) => item.trim()).filter(Boolean)
      : value;
    return acc;
  }, {});
}

export function inferMusicTags(input = {}) {
  const explicit = parseOntologyTags(input.body);
  const text = [
    input.title,
    input.artist,
    input.genre,
    input.album_type,
    input.albumType,
    input.one_liner,
    input.body,
    ...(input.mood || []),
  ].filter(Boolean).join(' ').toLowerCase();

  const tags = {
    genre: new Set(),
    mood: new Set(),
    texture: new Set(),
    era: new Set(),
    difficulty: new Set(),
    adjacentGenres: new Set(),
  };

  ontologyKeywordMap.forEach(([keyword, values]) => {
    if (!text.includes(keyword.toLowerCase())) return;
    Object.entries(values).forEach(([key, value]) => tags[key]?.add(value));
  });

  const era = inferEra(input.year || input.release_date || input.releaseDate);
  if (era) tags.era.add(era);

  Array.from(tags.genre).forEach((genre) => {
    const graph = genreGraph[genre];
    graph?.adjacentGenres?.forEach((item) => tags.adjacentGenres.add(item));
  });

  if (explicit.genre) tags.genre.add(explicit.genre);
  if (explicit.mood) tags.mood.add(explicit.mood);
  if (explicit.texture) tags.texture.add(explicit.texture);
  if (explicit.era) tags.era.add(explicit.era);
  if (explicit.difficulty) tags.difficulty.add(explicit.difficulty);
  (explicit.adjacentGenres || []).forEach((item) => tags.adjacentGenres.add(item));

  if (tags.genre.size === 0) tags.genre.add('Unknown');
  if (tags.mood.size === 0) tags.mood.add('unclassified');
  if (tags.texture.size === 0) tags.texture.add('unclassified');
  if (tags.difficulty.size === 0) tags.difficulty.add('Freshman');

  return Object.fromEntries(Object.entries(tags).map(([key, set]) => [key, Array.from(set)]));
}

export function flattenReviewForTags(review = {}) {
  const target = review.albums || review.tracks || review.album || {};
  return {
    title: target.title,
    artist: target.artist,
    genre: target.album_type || target.genre,
    year: target.release_date || target.year,
    one_liner: review.one_liner || review.text,
    body: review.body,
    rating: Number(review.rating || 0),
  };
}

export function extractTasteSignals(reviews = []) {
  const weights = {
    genre: new Map(),
    mood: new Map(),
    texture: new Map(),
    era: new Map(),
    difficulty: new Map(),
    adjacentGenres: new Map(),
  };

  reviews.forEach((review) => {
    const flat = flattenReviewForTags(review);
    const ratingWeight = Math.max(Number(flat.rating || 3), 1);
    const tags = inferMusicTags(flat);

    Object.entries(tags).forEach(([dimension, values]) => {
      values.forEach((value) => {
        const prev = weights[dimension].get(value) || 0;
        weights[dimension].set(value, prev + ratingWeight);
      });
    });
  });

  const top = Object.fromEntries(
    Object.entries(weights).map(([dimension, map]) => [
      dimension,
      Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([value, score]) => ({ value, score: Number(score.toFixed(1)) })),
    ])
  );

  const primaryGenre = top.genre?.find((item) => item.value !== 'Unknown')?.value || null;
  const graph = primaryGenre ? genreGraph[primaryGenre] : null;

  return {
    top,
    primaryGenre,
    nextFence: graph?.nextFence || ['Jazz', 'Ambient', 'Post-Punk'],
    bridgeMoods: graph?.bridgeMoods || top.mood?.map((item) => item.value).slice(0, 3) || [],
  };
}

export function scoreCurriculumTrack(track, taste) {
  if (!taste) return 0;
  let score = 0;
  if (taste.nextFence?.includes(track.genre)) score += 8;
  if (taste.primaryGenre === track.genre) score += 4;

  const signal = `${track.genre} ${track.signal} ${track.reason}`.toLowerCase();
  taste.bridgeMoods?.forEach((mood) => {
    if (signal.includes(String(mood).toLowerCase())) score += 2;
  });
  taste.top?.adjacentGenres?.forEach(({ value }) => {
    if (signal.includes(String(value).toLowerCase())) score += 1;
  });
  return score;
}

export function personalizeCurriculumTracks(tracks, taste) {
  if (!taste) return tracks;
  return [...tracks].sort((a, b) => scoreCurriculumTrack(b, taste) - scoreCurriculumTrack(a, taste));
}

function getRequiredRecordCount(requirements = []) {
  const text = requirements.join(' ');
  const match = text.match(/(?:Course Albums|앨범)\s*(\d+)개/);
  return match ? Number(match[1]) : 3;
}

function isRelatedToTrack(review, track) {
  const flat = flattenReviewForTags(review);
  const tags = inferMusicTags(flat);
  const haystack = [
    flat.title,
    flat.artist,
    flat.genre,
    flat.one_liner,
    flat.body,
    ...tags.genre,
    ...tags.mood,
    ...tags.texture,
    ...tags.adjacentGenres,
  ].filter(Boolean).join(' ').toLowerCase();

  return [track.genre, track.signal, ...(genreGraph[track.genre]?.adjacentGenres || [])]
    .filter(Boolean)
    .some((item) => haystack.includes(String(item).toLowerCase()));
}

export function calculateLevelProgress({ track, level, reviews = [], previousComplete = false }) {
  const related = reviews.filter((review) => isRelatedToTrack(review, track));
  const total = level.requirements.length;
  const requiredCount = getRequiredRecordCount(level.requirements);
  const longReviewCount = related.filter((review) => String(review.body || '').replace(/청음 태그:[\s\S]*/, '').trim().length >= 180).length;
  const distinctDays = new Set(related.map((review) => String(review.created_at || '').slice(0, 10)).filter(Boolean)).size;
  const taggedCount = related.filter((review) => Object.keys(parseOntologyTags(review.body)).length > 0).length;
  const highRatingCount = related.filter((review) => Number(review.rating || 0) >= 4).length;

  const checks = level.requirements.map((item, index) => {
    if (index === 0) return related.length >= requiredCount;
    if (String(item).includes('리뷰') || String(item).includes('감상')) return longReviewCount >= Math.min(3, Math.ceil(requiredCount / 2));
    if (String(item).includes('태그') || String(item).includes('정의') || String(item).includes('설명')) return taggedCount >= Math.min(3, requiredCount);
    if (String(item).includes('일') || String(item).includes('간격') || String(item).includes('유지')) return distinctDays >= 3;
    if (String(item).includes('반대') || String(item).includes('불편') || String(item).includes('재청취')) return highRatingCount >= Math.min(2, related.length);
    return related.length > index;
  });

  const completed = checks.filter(Boolean).length;
  return {
    relatedCount: related.length,
    completed,
    total,
    progress: total ? Math.round((completed / total) * 100) : 0,
    checks,
    unlocked: level.status === 'open' || previousComplete,
  };
}
