import Link from 'next/link';
import AppHeader from '../../components/AppHeader';
import { getSpotifyArchiveCollections } from '../../lib/spotifyArchive';

export const metadata = { title: '좋은 음악 아카이브 | 청음록' };
export const dynamic = 'force-dynamic';

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

export default async function ArchivePage() {
  const collections = await getSpotifyArchiveCollections();

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
        {collections.length ? (
          <div className="archiveJumpList" aria-label="아카이브 장르 바로가기">
            {collections.map((collection) => <a href={`#${collection.id}`} key={collection.id}>{collection.tags[0]}</a>)}
          </div>
        ) : null}

        <div className="archiveGrid archiveExploreGrid">
          {collections.length ? collections.map((collection) => (
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
          )) : <p className="empty">Spotify 아카이브를 불러오지 못했습니다. 검색에서 직접 앨범을 찾아보세요.</p>}
        </div>
      </section>
    </main>
  );
}
