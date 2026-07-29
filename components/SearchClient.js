'use client';

import { useRef, useState } from 'react';

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

function ResultCard({ item }) {
  const writeHref = buildWriteHref(item);

  return (
    <article className="spotifyResultCard">
      {item.coverUrl ? <div className="spotifyCover" style={{ backgroundImage: `url(${item.coverUrl})` }} aria-label={`${item.title} cover`} /> : <div className="miniCover"><span>{item.title.slice(0, 1)}</span></div>}
      <div>
        <p className="mood">{item.type === 'album' ? 'Album' : 'Track'} · {item.year}</p>
        <h3>{item.title}</h3>
        <p className="artist">{item.artist}</p>
        {item.album ? <p className="artist">from {item.album}</p> : null}
        <div className="reviewActions">
          <a href={item.externalUrl || '#'} target="_blank" rel="noreferrer">Spotify</a>
          <a href={writeHref}>기록하기</a>
        </div>
      </div>
    </article>
  );
}

export default function SearchClient() {
  const resultsRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ albums: [], tracks: [] });
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  async function runSearch() {
    const keyword = query.trim();
    if (!keyword || status === 'loading') return;

    setStatus('loading');
    setMessage('검색 중입니다. 잠시만 기다려 주세요.');
    setResults({ albums: [], tracks: [] });

    try {
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(keyword)}`, { cache: 'no-store' });
      const data = await response.json();

      if (!response.ok) {
        setStatus('error');
        setMessage(data.error || '검색에 실패했습니다.');
        setResults({ albums: [], tracks: [] });
        return;
      }

      setResults({ albums: data.albums || [], tracks: data.tracks || [] });
      setStatus('done');
      setMessage('');
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch {
      setStatus('error');
      setMessage('검색 요청 중 문제가 생겼습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.');
      setResults({ albums: [], tracks: [] });
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await runSearch();
  }

  const hasResults = results.albums.length > 0 || results.tracks.length > 0;

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
      {message ? <p className="searchMessage">{message}</p> : null}
      {status === 'done' && !hasResults ? <p className="searchMessage">검색 결과가 없습니다.</p> : null}
      {hasResults ? (
        <section className="spotifyResults" ref={resultsRef}>
          {results.albums.length ? (
            <div>
              <p className="eyebrow">spotify albums</p>
              <div className="spotifyResultGrid">{results.albums.map((item) => <ResultCard key={item.id} item={item} />)}</div>
            </div>
          ) : null}
          {results.tracks.length ? (
            <div>
              <p className="eyebrow">spotify tracks</p>
              <div className="spotifyResultGrid">{results.tracks.map((item) => <ResultCard key={item.id} item={item} />)}</div>
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
