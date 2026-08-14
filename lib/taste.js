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

export function normalizeMusicTagRecord(tag = {}) {
  if (!tag) return {};
  return {
    genre: tag.genre || '',
    mood: tag.mood || '',
    texture: tag.texture || '',
    era: tag.era || '',
    difficulty: tag.difficulty || '',
    adjacentGenres: tag.adjacentGenres || tag.adjacent_genres || [],
  };
}

export function inferMusicTags(input = {}) {
  const explicit = input.musicTag
    ? normalizeMusicTagRecord(input.musicTag)
    : parseOntologyTags(input.body);
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
    musicTag: review.musicTag,
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

const difficultyRank = { Freshman: 1, Sophomore: 2, Junior: 3, Senior: 4 };

function getReviewTagBundle(review) {
  const flat = flattenReviewForTags(review);
  const tags = inferMusicTags(flat);
  return { flat, tags };
}

function isRelatedToTrack(review, track) {
  const { flat, tags } = getReviewTagBundle(review);
  const trackGraph = genreGraph[track.genre] || {};
  const exactGenre = tags.genre.includes(track.genre);
  const adjacentGenre = [...(trackGraph.adjacentGenres || []), ...(tags.adjacentGenres || [])].includes(track.genre)
    || (tags.adjacentGenres || []).some((item) => (trackGraph.adjacentGenres || []).includes(item));
  const signalMatch = [flat.title, flat.artist, flat.genre, flat.one_liner, flat.body, ...tags.mood, ...tags.texture]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(String(track.signal || track.genre).split(' ')[0].toLowerCase());

  return exactGenre || adjacentGenre || signalMatch;
}

function getLevelRank(level) {
  return difficultyRank[level?.name] || 1;
}

function hasMoodOrTextureEvidence(review, track) {
  const { tags } = getReviewTagBundle(review);
  const signal = `${track.signal} ${track.reason}`.toLowerCase();
  return [...tags.mood, ...tags.texture].some((value) => signal.includes(String(value).toLowerCase()))
    || tags.mood.some((value) => value && value !== 'unclassified')
    || tags.texture.some((value) => value && value !== 'unclassified');
}

export function calculateLevelProgress({ track, level, reviews = [], previousComplete = false }) {
  const related = reviews.filter((review) => isRelatedToTrack(review, track));
  const total = level.requirements.length;
  const requiredCount = getRequiredRecordCount(level.requirements);
  const levelRank = getLevelRank(level);
  const exactGenreCount = related.filter((review) => getReviewTagBundle(review).tags.genre.includes(track.genre)).length;
  const matchingDifficultyCount = related.filter((review) => {
    const ranks = getReviewTagBundle(review).tags.difficulty.map((item) => difficultyRank[item] || 1);
    return ranks.some((rank) => rank >= levelRank);
  }).length;
  const moodTextureCount = related.filter((review) => hasMoodOrTextureEvidence(review, track)).length;
  const adjacentCount = related.filter((review) => {
    const tags = getReviewTagBundle(review).tags;
    return tags.adjacentGenres.length > 0 || tags.genre.some((genre) => (genreGraph[track.genre]?.adjacentGenres || []).includes(genre));
  }).length;
  const longReviewCount = related.filter((review) => String(review.body || '').replace(/청음 태그:[\s\S]*/, '').trim().length >= (levelRank >= 3 ? 500 : 180)).length;
  const distinctDays = new Set(related.map((review) => String(review.created_at || '').slice(0, 10)).filter(Boolean)).size;
  const taggedCount = related.filter((review) => review.musicTag || Object.keys(parseOntologyTags(review.body)).length > 0).length;
  const highRatingCount = related.filter((review) => Number(review.rating || 0) >= 4).length;

  const checks = level.requirements.map((item, index) => {
    const text = String(item);
    if (index === 0) return related.length >= requiredCount && exactGenreCount >= Math.ceil(requiredCount * 0.5);
    if (text.includes('고난도')) return matchingDifficultyCount >= Math.min(6, requiredCount);
    if (text.includes('인접 장르')) return adjacentCount >= Math.min(4, requiredCount);
    if (text.includes('질감') || text.includes('무드') || text.includes('리듬') || text.includes('보컬') || text.includes('사운드')) return moodTextureCount >= Math.min(5, requiredCount);
    if (text.includes('리뷰') || text.includes('감상') || text.includes('비교')) return longReviewCount >= Math.min(3, Math.ceil(requiredCount / 2));
    if (text.includes('태그') || text.includes('정의') || text.includes('설명') || text.includes('시대')) return taggedCount >= Math.min(3, requiredCount);
    if (text.includes('일') || text.includes('간격') || text.includes('유지')) return distinctDays >= (levelRank >= 2 ? 5 : 3);
    if (text.includes('반대') || text.includes('불편') || text.includes('재청취')) return highRatingCount >= Math.min(2, related.length) && taggedCount >= 1;
    return related.length > index;
  });

  const completed = checks.filter(Boolean).length;
  return {
    relatedCount: related.length,
    exactGenreCount,
    matchingDifficultyCount,
    moodTextureCount,
    adjacentCount,
    completed,
    total,
    progress: total ? Math.round((completed / total) * 100) : 0,
    checks,
    unlocked: level.status === 'open' || previousComplete,
  };
}
