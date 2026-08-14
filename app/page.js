import Link from 'next/link';
import AppHeader from '../components/AppHeader';
import AlbumCard from '../components/AlbumCard';
import ReviewCard from '../components/ReviewCard';
import NewsCard from '../components/NewsCard';
import IntroVideo from '../components/IntroVideo';
import { news as latestNews } from '../data/news';
import { getExternalNewsPosts, getNewsPosts, isPlaceholderNewsPost, mapSupabaseNewsPost } from '../lib/news';
import { getPublicReviews } from '../lib/reviews';
import { getSpotifyArchiveCollections, getSpotifyStarterAlbums } from '../lib/spotifyArchive';
import { supabase } from '../lib/supabase';

export const dynamic = 'force-dynamic';

const steps = ['검색', '별점', '감상 기록', '취향 발견'];

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
  const [{ data: reviewData }, { data: albumData }, { data: newsData }, externalNews, spotifyArchive, starterAlbums] = await Promise.all([
    getPublicReviews(),
    getRecentAlbums(),
    getNewsPosts({ limit: 6 }),
    getExternalNewsPosts(),
    getSpotifyArchiveCollections(),
    getSpotifyStarterAlbums(),
  ]);
  const hasRecordedAlbums = Boolean(albumData?.length);
  const albums = hasRecordedAlbums ? albumData.map(mapSupabaseAlbum) : starterAlbums;
  const reviews = reviewData?.length ? reviewData.slice(0, 5).map(mapSupabaseReview) : [];
  const editorialNews = (newsData || []).filter((post) => !isPlaceholderNewsPost(post)).map(mapSupabaseNewsPost);
  const seenNews = new Set();
  const news = [...externalNews, ...editorialNews, ...latestNews].filter((item) => {
    const key = item.sourceUrl || item.title;
    if (seenNews.has(key)) return false;
    seenNews.add(key);
    return true;
  }).slice(0, 3);

  return (
    <main className="homePage">
      <IntroVideo />

      <AppHeader />

      <section className="hero">
        <p className="eyebrow">music diary · ratings · reviews</p>
        <h1>익숙한 음악 너머로<br />취향의 울타리를 넓히는 곳.</h1>
        <p className="lead">
          청음록은 앨범과 곡을 검색해 별점과 감상을 남기고,
          나만의 청음 기록을 쌓으며 취향의 울타리를 넓혀가는 음악 기록 서비스입니다.
        </p>
        <div className="heroActions">
          <Link href="/search" className="primary">첫 음악 기록하기</Link>
          <Link href="/reviews" className="secondary">다른 감상 둘러보기</Link>
          <Link href="/about" className="secondary">청음록 소개</Link>
        </div>
        <div className="heroFlow" aria-label="청음록 이용 흐름">
          <div><span>01</span><b>검색</b><small>앨범과 곡을 찾습니다.</small></div>
          <div><span>02</span><b>기록</b><small>별점과 한줄평을 남깁니다.</small></div>
          <div><span>03</span><b>아카이브</b><small>내 취향이 프로필에 쌓입니다.</small></div>
        </div>
      </section>

      <section className="section">
        <div className="sectionTitle">
          <div>
            <p className="eyebrow">{hasRecordedAlbums ? 'curated albums' : 'spotify starters'}</p>
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
          <Link className="textLink" href="/archive">아카이브 탐색 →</Link>
        </div>
        <p className="archiveIntro">
          비슷한 음악을 더 추천하기보다, 아직 내 울타리 밖에 있는 좋은 음악으로 안내합니다.
          장르별 입문작, 오래 남은 음반, 함께 이야기할 만한 작품을 묶어 소개합니다.
        </p>
        <div className="archiveGrid">
          {spotifyArchive.length ? spotifyArchive.map((collection) => (
            <article className="archiveCard" key={collection.id}>
              <p className="mood">{collection.subtitle}</p>
              <h3>{collection.title}</h3>
              <p>{collection.description}</p>
              <div className="tags">{collection.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              <div className="archiveAlbums">
                {collection.albums.map((album) => (
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
          )) : <p className="empty">Spotify 아카이브를 불러오는 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.</p>}
        </div>
      </section>

      <section className="section split">
        <div>
          <p className="eyebrow">mvp plan</p>
          <h2>처음 버전은 가볍고, 흐름은 선명하게.</h2>
          <p className="bodyText">
            검색 → 별점 → 리뷰 → 내 기록까지 한 번에 이어지는 UX를 우선합니다.
            화면은 조용하고 따뜻하게, 글을 쓰고 싶어지는 분위기로 설계합니다.
          </p>
        </div>
        <div className="steps">
          {steps.map((step, index) => (
            <div key={step}><span>{String(index + 1).padStart(2, '0')}</span><b>{step}</b></div>
          ))}
        </div>
      </section>


      <section className="section">
        <div className="sectionTitle">
          <div>
            <p className="eyebrow">music news</p>
            <h2>최근 음악 소식</h2>
          </div>
          <Link className="textLink" href="/news">뉴스 더 보기 →</Link>
        </div>
        {news.length === 0 ? <p className="empty">등록된 뉴스가 없습니다.</p> : null}
        <div className="newsGrid">
          {news.map((item) => <NewsCard key={item.id} item={item} />)}
        </div>
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
