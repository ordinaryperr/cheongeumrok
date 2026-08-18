'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { curriculumTracks } from '../data/beyondYourFence';
import { archiveCollections } from '../lib/spotifyArchive';

async function fetchSearchResults(keyword) {
  const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(keyword)}`, { cache: 'no-store' });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '검색에 실패했습니다.');
  }

  return { albums: data.albums || [], tracks: data.tracks || [] };
}

function genreParam(value = '') {
  return String(value).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function normalizeText(value = '') {
  return String(value).toLowerCase().replace(/[—–-]/g, ' ').replace(/[^a-z0-9가-힣&]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function findSearchContext(keyword = '') {
  const normalized = normalizeText(keyword);
  if (!normalized) return null;

  const archiveMatch = archiveCollections.find((collection) => (
    collection.tags.some((tag) => normalizeText(tag) === normalized || normalized.includes(normalizeText(tag)))
    || normalizeText(collection.title).includes(normalized)
  ));

  const routeMatch = curriculumTracks.find((track) => {
    const trackParam = genreParam(track.genre);
    const genreHit = normalizeText(track.genre) === normalized || normalized.includes(normalizeText(track.genre));
    const albumHit = track.levels.some((level) => level.albums.some((album) => normalizeText(album).includes(normalized) || normalized.includes(normalizeText(album))));
    return genreHit || albumHit || trackParam === genreParam(keyword);
  });

  const matched = routeMatch || (archiveMatch ? curriculumTracks.find((track) => normalizeText(track.genre) === normalizeText(archiveMatch.tags[0])) : null);
  if (!matched && !archiveMatch) return null;

  const genre = matched?.genre || archiveMatch.tags[0];
  const param = genreParam(genre);
  return {
    genre,
    archiveHref: `/archive?genre=${encodeURIComponent(archiveMatch?.tags[0] || genre)}`,
    beyondHref: `/beyond-your-fence?genre=${param}#${param}`,
    description: matched
      ? `${genre} 검색은 Beyond ${genre} Freshman Route와 연결됩니다. 검색 결과에서 앨범을 둘러보고 기록하면 진행도 계산에 반영됩니다.`
      : `${genre} 아카이브와 연결된 검색입니다. 실제 앨범을 둘러보고 기록으로 이어가세요.`,
  };
}

function buildWriteHref(item) {
  const params = new URLSearchParams({
    spotify: item.id,
    type: item.type,
    title: item.title,
    artist: item.artist,
    year: item.year || '',
    coverUrl: item.coverUrl || '',
    externalUrl: item.externalUrl || '',
  });

  if (item.album) params.set('album', item.album);
  if (item.releaseDate) params.set('releaseDate', item.releaseDate);
  if (item.durationMs) params.set('durationMs', String(item.durationMs));

  return `/write?${params.toString()}`;
}

function ResultCard({ item, context }) {
  const writeHref = buildWriteHref(item);
  const browseHref = item.type === 'album' ? `/albums/spotify/${item.id}` : null;

  return (
    <article className="spotifyResultCard">
      {item.coverUrl ? <div className="spotifyCover" style={{ backgroundImage: `url(${item.coverUrl})` }} aria-label={`${item.title} cover`} /> : <div className="miniCover"><span>{item.title.slice(0, 1)}</span></div>}
      <div>
        <p className="mood">{item.type === 'album' ? 'Album' : 'Track'} · {item.year}</p>
        <h3>{item.title}</h3>
        <p className="artist">{item.artist}</p>
        {item.album ? <p className="artist">from {item.album}</p> : null}
        {context ? <p className="searchRouteHint">{context.genre} Route candidate</p> : null}
        <div className="reviewActions">
          <a href={item.externalUrl || '#'} target="_blank" rel="noreferrer">Spotify</a>
          {browseHref ? <Link href={browseHref}>앨범 둘러보기</Link> : null}
          <Link href={writeHref}>기록하기</Link>
          {context ? <Link href={context.beyondHref}>Beyond Route</Link> : null}
        </div>
      </div>
    </article>
  );
}

export default function SearchClient({ initialQuery = '' }) {
  const resultsRef = useRef(null);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState({ albums: [], tracks: [] });
  const [status, setStatus] = useState(initialQuery ? 'loading' : 'idle');
  const [message, setMessage] = useState(initialQuery ? '검색 중입니다. 잠시만 기다려 주세요.' : '');

  useEffect(() => {
    if (!initialQuery) return;

    let cancelled = false;

    async function loadInitialResults() {
      try {
        const nextResults = await fetchSearchResults(initialQuery);
        if (cancelled) return;
        setResults(nextResults);
        setStatus('done');
        setMessage('');
      } catch (error) {
        if (cancelled) return;
        setResults({ albums: [], tracks: [] });
        setStatus('error');
        setMessage(error.message || '검색 요청 중 문제가 생겼습니다.');
      }
    }

    loadInitialResults();
    return () => {
      cancelled = true;
    };
  }, [initialQuery]);

  async function runSearch(nextQuery = query) {
    const keyword = nextQuery.trim();
    if (!keyword || status === 'loading') return;

    setStatus('loading');
    setMessage('검색 중입니다. 잠시만 기다려 주세요.');
    setResults({ albums: [], tracks: [] });

    try {
      const nextResults = await fetchSearchResults(keyword);
      setResults(nextResults);
      setStatus('done');
      setMessage('');
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (error) {
      setStatus('error');
      setMessage(error.message || '검색 요청 중 문제가 생겼습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.');
      setResults({ albums: [], tracks: [] });
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await runSearch();
  }

  const hasResults = results.albums.length > 0 || results.tracks.length > 0;
  const searchContext = useMemo(() => findSearchContext(query), [query]);

  return (
    <>
      <form className="searchBox" onSubmit={handleSubmit} role="search">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="앨범, 곡, 아티스트 검색"
          enterKeyHint="search"
          autoCapitalize="none"
          autoCorrect="off"
          inputMode="search"
        />
        <button type="submit" disabled={status === 'loading' || !query.trim()}>{status === 'loading' ? '검색중' : '검색'}</button>
      </form>
      {searchContext ? (
        <div className="searchContextBox">
          <span>Archive / Beyond Context</span>
          <b>{searchContext.genre}</b>
          <p>{searchContext.description}</p>
          <div className="reviewActions">
            <Link href={searchContext.archiveHref}>Archive 보기</Link>
            <Link href={searchContext.beyondHref}>Beyond에서 시작하기</Link>
          </div>
        </div>
      ) : null}
      {message ? <p className="searchMessage">{message}</p> : null}
      {status === 'done' && !hasResults ? <p className="searchMessage">검색 결과가 없습니다.</p> : null}
      {hasResults ? (
        <section className="spotifyResults" ref={resultsRef}>
          {results.albums.length ? (
            <div>
              <p className="eyebrow">spotify albums</p>
              <div className="spotifyResultGrid">{results.albums.map((item) => <ResultCard key={item.id} item={item} context={searchContext} />)}</div>
            </div>
          ) : null}
          {results.tracks.length ? (
            <div>
              <p className="eyebrow">spotify tracks</p>
              <div className="spotifyResultGrid">{results.tracks.map((item) => <ResultCard key={item.id} item={item} context={searchContext} />)}</div>
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
