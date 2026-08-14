import Link from 'next/link';
import AppHeader from '../../components/AppHeader';
import { getSpotifyArchiveCollections } from '../../lib/spotifyArchive';

export const metadata = { title: '좋은 음악 아카이브 | 청음록' };
export const dynamic = 'force-dynamic';

const genreOptions = ['All', 'Jazz', 'Ambient', 'Post-Punk', 'Hip-Hop', 'Dubstep', 'R&B', 'Electronic', 'Shoegaze', 'Metal'];

function buildArchiveHref({ genre = 'All', q = '' } = {}) {
  const params = new URLSearchParams();
  if (genre && genre !== 'All') params.set('genre', genre);
  if (q) params.set('q', q);
  const query = params.toString();
  return query ? `/archive?${query}` : '/archive';
}

function matchesSearch(collection, q) {
  if (!q) return true;
  const normalized = q.toLowerCase();
  const haystack = [
    collection.title,
    collection.subtitle,
    collection.description,
    ...collection.tags,
    ...collection.albums.flatMap((album) => [album.title, album.artist, album.year]),
  ].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(normalized);
}

function filterCollections(collections, { genre, q }) {
  return collections.filter((collection) => {
    const genreMatch = !genre || genre === 'All' || collection.tags.some((tag) => tag.toLowerCase() === genre.toLowerCase());
    return genreMatch && matchesSearch(collection, q);
  });
}

function buildWriteHref(album) {
  const params = new URLSearchParams({
    spotify: album.id,
    type: 'album',
    title: album.title,
    artist: album.artist,
    year: album.year || '',
    coverUrl: album.coverUrl || '',
    externalUrl: album.externalUrl || '',
  });

  return `/write?${params.toString()}`;
}

export default async function ArchivePage({ searchParams }) {
  const params = await searchParams;
  const selectedGenre = typeof params?.genre === 'string' && genreOptions.includes(params.genre) ? params.genre : 'All';
  const query = typeof params?.q === 'string' ? params.q.trim() : '';
  const collections = await getSpotifyArchiveCollections();
  const filteredCollections = filterCollections(collections, { genre: selectedGenre, q: query });

  return (
    <main className="archivePage">
      <AppHeader />
      <section className="pageHero small">
        <p className="eyebrow">good music archive</p>
        <h1>좋은 음악 아카이브</h1>
        <p className="lead">장르별 입문작과 오래 남은 음반을 Spotify 실제 앨범 데이터로 모았습니다. 마음에 드는 앨범은 둘러보고 바로 기록으로 이어가세요.</p>
        <div className="heroActions">
          <Link className="primary" href="/search">직접 검색하기</Link>
          <Link className="secondary" href="/beyond-your-fence">Beyond 커리큘럼 보기</Link>
        </div>
      </section>

      <section className="section topTight">
        <form className="archiveSearchForm" action="/archive">
          {selectedGenre !== 'All' ? <input type="hidden" name="genre" value={selectedGenre} /> : null}
          <input name="q" defaultValue={query} placeholder="앨범, 아티스트, 장르 검색" />
          <button type="submit">검색</button>
          {query || selectedGenre !== 'All' ? <Link href="/archive">초기화</Link> : null}
        </form>

        {collections.length ? (
          <div className="archiveJumpList" aria-label="아카이브 장르 필터">
            {genreOptions.map((genre) => (
              <Link className={selectedGenre === genre ? 'active' : ''} href={buildArchiveHref({ genre, q: query })} key={genre}>{genre}</Link>
            ))}
          </div>
        ) : null}

        {(query || selectedGenre !== 'All') ? <p className="feedHelper">현재 필터: {selectedGenre} {query ? `· “${query}”` : ''}</p> : null}

        <div className="archiveGrid archiveExploreGrid">
          {filteredCollections.length ? filteredCollections.map((collection) => (
            <article className="archiveCard archiveExploreCard" id={collection.id} key={collection.id}>
              <p className="mood">{collection.subtitle}</p>
              <h2>{collection.title}</h2>
              <p>{collection.description}</p>
              <div className="tags">{collection.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              <div className="archiveExploreAlbums">
                {collection.albums.map((album) => (
                  <article className="archiveExploreAlbum" key={album.id}>
                    <Link className="archiveExploreCover" href={album.href || `/albums/spotify/${album.id}`}>
                      {album.coverUrl ? <span className="imageCover" style={{ backgroundImage: `url(${album.coverUrl})` }} /> : <span>{album.title.slice(0, 1)}</span>}
                    </Link>
                    <div>
                      <p className="mood">{album.year} · Spotify Album</p>
                      <h3>{album.title}</h3>
                      <p className="artist">{album.artist}</p>
                      <div className="reviewActions">
                        <Link href={album.href || `/albums/spotify/${album.id}`}>앨범 둘러보기</Link>
                        <Link href={buildWriteHref(album)}>기록하기</Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </article>
          )) : <p className="empty">조건에 맞는 아카이브가 없습니다. 장르나 검색어를 바꿔보세요.</p>}
        </div>
      </section>
    </main>
  );
}
