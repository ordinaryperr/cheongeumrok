import AppHeader from '../../../../components/AppHeader';
import { getSpotifyItem } from '../../../../lib/spotify';
import { inferMusicTags } from '../../../../lib/taste';

export const dynamic = 'force-dynamic';

function genreParam(value = '') {
  return String(value).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function getAlbumRouteHint(album) {
  const tags = inferMusicTags({ title: album.title, artist: album.artist, year: album.year });
  const genre = tags.genre?.find((item) => !['Unknown', 'unclassified'].includes(item));
  if (!genre) return null;
  const param = genreParam(genre);
  return { genre, href: `/beyond-your-fence?genre=${param}#${param}` };
}

function getWriteHref(album) {
  const params = new URLSearchParams({
    spotify: album.id,
    type: 'album',
    title: album.title,
    artist: album.artist,
    year: album.year || '',
    releaseDate: album.releaseDate || album.year || '',
    coverUrl: album.coverUrl || '',
    externalUrl: album.externalUrl || '',
  });
  return `/write?${params.toString()}`;
}

function buildSpotifyAlbumDescription(album) {
  return `${album.artist}의 ${album.title}은 ${album.releaseDate || album.year || '발매일 미상'}에 공개된 앨범입니다. 총 ${album.totalTracks || '여러'}개 트랙으로 구성되어 있으며, 이 페이지는 Spotify 검색 결과를 바탕으로 앨범을 먼저 둘러볼 수 있게 만든 미리보기입니다. 기록을 남기면 청음록 앨범 페이지에 평균 별점, 리뷰, 댓글, 취향 태그가 함께 쌓입니다.`;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const album = await getSpotifyItem({ id, type: 'album' });
    return { title: `${album?.title || 'Spotify Album'} | 청음록` };
  } catch {
    return { title: 'Spotify Album | 청음록' };
  }
}

export default async function SpotifyAlbumPreviewPage({ params }) {
  const { id } = await params;
  let album = null;
  let errorMessage = '';

  try {
    album = await getSpotifyItem({ id, type: 'album' });
  } catch (error) {
    errorMessage = error.message || '앨범 정보를 불러오지 못했습니다.';
  }

  if (!album) {
    return (
      <main>
        <AppHeader />
        <section className="section topTight narrow">
          <div className="emptyState">
            <p className="eyebrow">spotify album</p>
            <h2>앨범 정보를 불러오지 못했습니다.</h2>
            <p>{errorMessage}</p>
            <div className="heroActions"><a className="primary" href="/search">검색으로 돌아가기</a></div>
          </div>
        </section>
      </main>
    );
  }

  const routeHint = getAlbumRouteHint(album);

  return (
    <main>
      <AppHeader />
      <section className="albumDetail">
        {album.coverUrl ? <div className="cover big imageCover" style={{ backgroundImage: `url(${album.coverUrl})` }} /> : <div className="cover big"><span>{album.title.slice(0, 1)}</span></div>}
        <div>
          <p className="eyebrow">Spotify Album · {album.year || '연도 미상'}</p>
          <h1>{album.title}</h1>
          <p className="lead">{album.artist}</p>
          <div className="ratingPanel">
            <div><b>{album.totalTracks || '—'}</b><span>트랙 수</span></div>
            <div><b>{album.releaseDate || album.year || '—'}</b><span>발매일</span></div>
            <div><b>Spotify</b><span>데이터 출처</span></div>
          </div>
          <article className="albumDescriptionBox">
            <p className="eyebrow">album description</p>
            <p>{buildSpotifyAlbumDescription(album)}</p>
          </article>
          {routeHint ? (
            <div className="albumRouteBox">
              <span>Archive / Beyond Route</span>
              <b>{routeHint.genre} Freshman Route와 연결될 수 있습니다.</b>
              <a href={routeHint.href}>Beyond에서 보기 →</a>
            </div>
          ) : null}
          <div className="heroActions">
            <a className="primary" href={getWriteHref(album)}>이 앨범 기록하기</a>
            {album.externalUrl ? <a className="secondary spotifyButton" href={album.externalUrl} target="_blank" rel="noreferrer">Spotify에서 듣기</a> : null}
            <a className="secondary" href="/search">다른 음악 찾기</a>
          </div>
        </div>
      </section>
    </main>
  );
}
