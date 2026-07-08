import AppHeader from '../components/AppHeader';
import AlbumCard from '../components/AlbumCard';
import ReviewCard from '../components/ReviewCard';
import NewsCard from '../components/NewsCard';
import { albums as mockAlbums, reviews as mockReviews, goodMusicArchive } from '../data/mock';
import { news as mockNews } from '../data/news';
import { getNewsPosts, mapSupabaseNewsPost } from '../lib/news';
import { getPublicReviews } from '../lib/reviews';
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
    user: 'listener',
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
  const [{ data: reviewData }, { data: albumData }, { data: newsData }] = await Promise.all([
    getPublicReviews(),
    getRecentAlbums(),
    getNewsPosts({ limit: 3 }),
  ]);
  const albums = albumData?.length ? albumData.map(mapSupabaseAlbum) : mockAlbums;
  const reviews = reviewData?.length ? reviewData.slice(0, 5).map(mapSupabaseReview) : mockReviews;
  const news = newsData?.length ? newsData.map(mapSupabaseNewsPost) : mockNews;

  return (
    <main>
      <AppHeader />

      <section className="hero">
        <p className="eyebrow">music diary · ratings · reviews</p>
        <h1>익숙한 음악 너머로<br />취향의 울타리를 넓히는 곳.</h1>
        <p className="lead">
          청음록은 좋은 노래와 음반을 함께 발견하고, 별점과 댓글로 이야기하며,
          나만의 음악 세계를 조금씩 확장해가는 커뮤니티입니다.
        </p>
        <div className="heroActions">
          <a href="/search" className="primary">음악 검색하기</a>
          <a href="/write" className="secondary">감상 기록하기</a>
        </div>
      </section>

      <section className="section">
        <div className="sectionTitle">
          <div>
            <p className="eyebrow">curated albums</p>
            <h2>지금 남겨진 앨범들</h2>
          </div>
          <a className="textLink" href="/search">더 찾아보기 →</a>
        </div>
        <div className="albumGrid">
          {albums.map((album) => <AlbumCard key={album.id} album={album} />)}
        </div>
      </section>

      <section className="section archiveSection">
        <div className="sectionTitle">
          <div>
            <p className="eyebrow">good music archive</p>
            <h2>좋은 음악 아카이브</h2>
          </div>
          <a className="textLink" href="/search">아카이브 탐색 →</a>
        </div>
        <p className="archiveIntro">
          비슷한 음악을 더 추천하기보다, 아직 내 울타리 밖에 있는 좋은 음악으로 안내합니다.
          장르별 입문작, 오래 남은 음반, 함께 이야기할 만한 작품을 묶어 소개합니다.
        </p>
        <div className="archiveGrid">
          {goodMusicArchive.map((collection) => (
            <article className="archiveCard" key={collection.id}>
              <p className="mood">{collection.subtitle}</p>
              <h3>{collection.title}</h3>
              <p>{collection.description}</p>
              <div className="tags">{collection.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              <div className="archiveAlbums">
                {collection.albums.map((album) => (
                  <a href={`/albums/${album.id}`} key={album.id}>
                    <span>{album.title.slice(0, 1)}</span>
                    <b>{album.title}</b>
                    <small>{album.artist}</small>
                  </a>
                ))}
              </div>
            </article>
          ))}
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
          <a className="textLink" href="/news">뉴스 더 보기 →</a>
        </div>
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
          <a className="textLink" href="/reviews">피드 보기 →</a>
        </div>
        <div className="feedList">
          {reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
        </div>
      </section>
    </main>
  );
}
