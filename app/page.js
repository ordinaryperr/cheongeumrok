import Link from 'next/link';
import AppHeader from '../components/AppHeader';
import AlbumCard from '../components/AlbumCard';
import ReviewCard from '../components/ReviewCard';
import IntroVideo from '../components/IntroVideo';
import { getPublicReviews } from '../lib/reviews';
import { getSpotifyArchiveCollections, getSpotifyStarterAlbums } from '../lib/spotifyArchive';
import { supabase } from '../lib/supabase';

export const dynamic = 'force-dynamic';

function formatTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function mapSupabaseReview(review) {
  const target = review.albums || review.tracks;

  return {
    id: review.id,
    user: review.user_id?.slice(0, 8) || 'listener',
    userId: review.user_id || null,
    rating: Number(review.rating),
    text: review.one_liner || review.body || '감상을 남겼습니다.',
    createdAt: formatTime(review.created_at),
    album: {
      id: target?.id || review.id,
      title: target?.title || 'Unknown Music',
      artist: target?.artist || 'Unknown Artist',
      coverUrl: target?.cover_url || target?.albums?.cover_url || null,
    },
  };
}

function mapSupabaseAlbum(album) {
  return {
    id: album.id,
    title: album.title,
    artist: album.artist,
    year: album.release_date?.slice(0, 4) || '연도 미상',
    genre: album.album_type || 'Spotify',
    rating: 0,
    reviews: 0,
    mood: ['발견', '기록됨'],
    coverUrl: album.cover_url,
    description: '',
  };
}

async function getRecentAlbums() {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured') };

  return supabase
    .from('albums')
    .select('id, title, artist, cover_url, release_date, album_type, created_at')
    .order('created_at', { ascending: false })
    .limit(6);
}

export default async function Home() {
  const [{ data: reviewData }, { data: albumData }, spotifyArchive, starterAlbums] = await Promise.all([
    getPublicReviews(),
    getRecentAlbums(),
    getSpotifyArchiveCollections(),
    getSpotifyStarterAlbums(),
  ]);

  const hasRecordedAlbums = Boolean(albumData?.length);
  const albums = hasRecordedAlbums ? albumData.map(mapSupabaseAlbum) : starterAlbums;
  const reviews = reviewData?.length ? reviewData.slice(0, 5).map(mapSupabaseReview) : [];
  const archivePreview = spotifyArchive.slice(0, 6);

  return (
    <main className="homePage simplifiedHome">
      <IntroVideo />
      <AppHeader />

      <section className="hero">
        <div className="homeHeroImage" aria-hidden="true" />
        <p className="eyebrow">music diary · ratings · reviews</p>
        <h1>익숙한 음악 너머로<br />취향의 울타리를 넓히는 곳.</h1>
        <p className="lead heroStatement">
          기록은 출석이고, 감상은 취향의 지도입니다. 청음록은 당신이 들은 음악을 바탕으로 울타리 밖의 앨범을 과제로 제시합니다.
        </p>
        <div className="heroMantra">Not recommendations. Assignments.</div>
        <div className="heroActions">
          <Link href="/search" className="primary">첫 음악 기록하기</Link>
          <Link href="/beyond-your-fence" className="secondary">Beyond 시작하기</Link>
        </div>
        <div className="homeFocusGrid" aria-label="청음록 핵심 흐름">
          <Link href="/search"><span>01</span><b>Search & Write</b><small>Spotify에서 찾고 바로 기록합니다.</small></Link>
          <Link href="/archive"><span>02</span><b>Archive</b><small>장르별 실제 앨범으로 취향을 넓힙니다.</small></Link>
          <Link href="/beyond-your-fence"><span>03</span><b>Beyond</b><small>기록을 커리큘럼 진도로 바꿉니다.</small></Link>
        </div>
      </section>

      <section className="section">
        <div className="sectionTitle">
          <div>
            <p className="eyebrow">{hasRecordedAlbums ? 'recently recorded' : 'spotify starters'}</p>
            <h2>{hasRecordedAlbums ? '지금 남겨진 앨범들' : '먼저 둘러볼 실제 앨범들'}</h2>
          </div>
          <Link className="textLink" href="/search">더 찾아보기 →</Link>
        </div>
        <div className="albumGrid">
          {albums.length ? albums.map((album) => <AlbumCard key={album.id} album={album} />) : <p className="empty">Spotify 앨범을 불러오지 못했습니다. 검색에서 직접 앨범을 찾아보세요.</p>}
        </div>
      </section>

      <section className="section archiveSection">
        <div className="sectionTitle">
          <div>
            <p className="eyebrow">good music archive</p>
            <h2>좋은 음악 아카이브</h2>
          </div>
          <Link className="textLink" href="/archive">전체 아카이브 →</Link>
        </div>
        <p className="archiveIntro">홈에서는 대표 Route만 가볍게 보여줍니다. 전체 장르와 검색은 아카이브 페이지에서 탐색하세요.</p>
        <div className="archiveGrid">
          {archivePreview.length ? archivePreview.map((collection) => (
            <article className="archiveCard" key={collection.id}>
              <p className="mood">{collection.subtitle}</p>
              <h3>{collection.title}</h3>
              <p>{collection.description}</p>
              <div className="tags">{collection.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              <div className="archiveAlbums">
                {collection.albums.slice(0, 3).map((album) => (
                  <Link href={album.href || `/albums/${album.id}`} key={album.id}>
                    <span
                      className={album.coverUrl ? 'archiveAlbumCover imageCover' : 'archiveAlbumCover'}
                      style={album.coverUrl ? { backgroundImage: `url(${album.coverUrl})` } : undefined}
                    >{album.coverUrl ? '' : album.title.slice(0, 1)}</span>
                    <b>{album.title}</b>
                    <small>{album.artist}</small>
                  </Link>
                ))}
              </div>
            </article>
          )) : <p className="empty">Spotify 아카이브를 불러오는 중 문제가 생겼습니다.</p>}
        </div>
      </section>

      <section className="section beyondHomeCta">
        <div>
          <p className="eyebrow">listening curriculum</p>
          <h2>Beyond Your Fence</h2>
          <p className="bodyText">추천을 많이 보여주기보다, 듣고 기록해야 열리는 커리큘럼으로 취향의 바깥을 안내합니다.</p>
        </div>
        <Link className="primary" href="/beyond-your-fence">커리큘럼 보기</Link>
      </section>

      <section className="section">
        <div className="sectionTitle">
          <div>
            <p className="eyebrow">live feed</p>
            <h2>최근 감상</h2>
          </div>
          <Link className="textLink" href="/reviews">피드 보기 →</Link>
        </div>
        <div className="feedList">
          {reviews.length ? reviews.map((review) => <ReviewCard key={review.id} review={review} />) : <p className="empty">아직 공개 감상이 없습니다. 첫 감상을 남겨보세요.</p>}
        </div>
      </section>
    </main>
  );
}
