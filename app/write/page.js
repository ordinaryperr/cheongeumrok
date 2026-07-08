import AppHeader from '../../components/AppHeader';
import { albums } from '../../data/mock';
import { getSpotifyItem, hasSpotifyCredentials } from '../../lib/spotify';
import WriteReviewForm from '../../components/WriteReviewForm';

export const metadata = { title: '감상 기록하기 | 청음록' };

export default async function WritePage({ searchParams }) {
  const params = await searchParams;
  const selectedAlbum = albums.find((item) => item.id === params?.album) || albums[0];
  let spotifyItem = null;

  if (params?.spotify && params?.type && params?.title && params?.artist) {
    spotifyItem = {
      id: params.spotify,
      type: params.type,
      title: params.title,
      artist: params.artist,
      album: params.album || '',
      year: params.year || '',
      releaseDate: params.releaseDate || params.year || '',
      durationMs: params.durationMs ? Number(params.durationMs) : null,
      coverUrl: params.coverUrl || null,
      externalUrl: params.externalUrl || null,
    };
  } else if (params?.spotify && params?.type && hasSpotifyCredentials()) {
    try {
      spotifyItem = await getSpotifyItem({ id: params.spotify, type: params.type });
    } catch {
      spotifyItem = null;
    }
  }

  const selectedTypeLabel = spotifyItem?.type === 'track' ? 'Spotify Track' : spotifyItem?.type === 'album' ? 'Spotify Album' : 'Mock Album';

  return (
    <main>
      <AppHeader />
      <section className="pageHero small">
        <p className="eyebrow">write</p>
        <h1>오늘의 감상을 남겨보세요.</h1>
        <p className="lead">별점으로 시작해 한줄평, 긴 감상, 추천 트랙까지 이어지는 기록 흐름입니다. 좋은 음악을 나만의 언어로 남겨보세요.</p>
      </section>
      <section className="section topTight narrow">
        <div className="writeFlow">
          <div><span>01</span><b>음반 선택</b><small>오늘 들은 음악을 고릅니다.</small></div>
          <div><span>02</span><b>별점</b><small>0.5 단위로 빠르게 남깁니다.</small></div>
          <div><span>03</span><b>감상</b><small>한줄평과 긴 글을 기록합니다.</small></div>
          <div><span>04</span><b>대화</b><small>댓글과 추천으로 이어집니다.</small></div>
        </div>
        {spotifyItem ? (
          <article className="selectedMusicCard">
            {spotifyItem.coverUrl ? <div className="spotifyCover bigCover" style={{ backgroundImage: `url(${spotifyItem.coverUrl})` }} /> : <div className="cover"><span>{spotifyItem.title.slice(0, 1)}</span></div>}
            <div>
              <p className="mood">{selectedTypeLabel} · {spotifyItem.year}</p>
              <h3>{spotifyItem.title}</h3>
              <p className="artist">{spotifyItem.artist}</p>
              {spotifyItem.album ? <p className="artist">from {spotifyItem.album}</p> : null}
              <p className="bodyText">검색 결과에서 선택한 음악이 작성 폼에 자동으로 반영되었습니다.</p>
            </div>
          </article>
        ) : null}
        <WriteReviewForm selectedMusic={spotifyItem} fallbackAlbums={albums} />
      </section>
    </main>
  );
}
