import AppHeader from '../../../components/AppHeader';
import ReviewCard from '../../../components/ReviewCard';
import AlbumComments from '../../../components/AlbumComments';
import MyAlbumRating from '../../../components/MyAlbumRating';
import { getAlbumComments, mapAlbumComment } from '../../../lib/comments';
import { inferMusicTags } from '../../../lib/taste';
import { supabase } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return [];
}

function formatTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function mapSupabaseReview(review, album) {
  return {
    id: review.id,
    user: review.user_id?.slice(0, 8) || 'listener',
    userId: review.user_id || null,
    rating: Number(review.rating),
    text: review.one_liner || review.body || '감상을 남겼습니다.',
    body: review.body || '',
    rawBody: review.body || '',
    createdAt: formatTime(review.created_at),
    album: {
      id: album.id,
      title: album.title,
      artist: album.artist,
      coverUrl: album.cover_url || null,
    },
  };
}

function mapSupabaseAlbum(album, albumReviews) {
  const ratings = albumReviews.map((review) => Number(review.rating)).filter(Boolean);
  const average = ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;

  return {
    id: album.id,
    spotifyId: album.spotify_id,
    title: album.title,
    artist: album.artist,
    year: album.release_date?.slice(0, 4) || '연도 미상',
    genre: album.album_type || 'Spotify',
    rating: average,
    reviews: albumReviews.length,
    mood: ['Spotify', '기록됨'],
    description: album.external_url
      ? `${album.artist}의 ${album.title}은 ${album.release_date?.slice(0, 4) || '연도 미상'}년에 공개된 ${album.album_type || 'album'}입니다. Spotify 메타데이터와 청음록 사용자 기록을 바탕으로 평균 별점, 리뷰, 댓글을 모아 보여줍니다.`
      : '청음록에 기록된 앨범입니다.',
    coverUrl: album.cover_url,
    externalUrl: album.external_url,
    releaseDate: album.release_date,
  };
}

async function getSupabaseAlbum(id) {
  if (!supabase) return null;

  const { data: album, error: albumError } = await supabase
    .from('albums')
    .select('id, spotify_id, title, artist, cover_url, release_date, album_type, external_url, created_at')
    .eq('id', id)
    .maybeSingle();

  if (albumError || !album) return null;

  const { data: albumReviews, error: reviewError } = await supabase
    .from('reviews')
    .select('id, user_id, rating, one_liner, body, created_at')
    .eq('album_id', id)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  const reviews = reviewError ? [] : albumReviews || [];
  return {
    album: mapSupabaseAlbum(album, reviews),
    reviews: reviews.map((review) => mapSupabaseReview(review, album)),
  };
}

function getRatingDistribution(reviews) {
  const buckets = [5, 4, 3, 2, 1];
  return buckets.map((score) => {
    const count = reviews.filter((review) => Math.floor(Number(review.rating)) === score).length;
    return { score, count };
  });
}

function getWriteHref(album) {
  if (album.spotifyId && !album.spotifyId.startsWith('mock:')) {
    const params = new URLSearchParams({
      spotify: album.spotifyId,
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

  return `/write?album=${album.id}`;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const supabaseData = await getSupabaseAlbum(id);
  const album = supabaseData?.album;
  return { title: album ? `${album.title} - ${album.artist} | 청음록` : '앨범을 찾을 수 없습니다 | 청음록' };
}

function genreParam(value = '') {
  return String(value).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function getAlbumRouteHint(album) {
  const tags = inferMusicTags({ title: album.title, artist: album.artist, genre: album.genre, year: album.year });
  const genre = tags.genre?.find((item) => !['Unknown', 'unclassified'].includes(item));
  if (!genre) return null;
  const param = genreParam(genre);
  return { genre, href: `/beyond-your-fence?genre=${param}#${param}` };
}

export default async function AlbumPage({ params, searchParams }) {
  const { id } = await params;
  const query = await searchParams;
  const saved = query?.saved === '1';
  const supabaseData = await getSupabaseAlbum(id);
  if (!supabaseData?.album) {
    return (
      <main>
        <AppHeader />
        <section className="section topTight narrow">
          <div className="emptyState">
            <p className="eyebrow">album</p>
            <h2>앨범을 찾을 수 없습니다.</h2>
            <p>삭제되었거나 아직 청음록에 기록되지 않은 앨범입니다. Spotify 검색으로 실제 앨범을 먼저 둘러볼 수 있습니다.</p>
            <div className="heroActions"><a className="primary" href="/search">앨범 검색하기</a></div>
          </div>
        </section>
      </main>
    );
  }

  const album = supabaseData.album;
  const albumReviews = supabaseData.reviews;
  const { data: commentData } = await getAlbumComments(album.id);
  const comments = (commentData || []).map(mapAlbumComment);
  const ratingText = album.rating ? album.rating.toFixed(1) : '—';
  const distribution = getRatingDistribution(albumReviews);
  const maxDistributionCount = Math.max(...distribution.map((item) => item.count), 1);
  const writeHref = getWriteHref(album);
  const routeHint = getAlbumRouteHint(album);

  return (
    <main>
      <AppHeader />
      <section className="albumDetail">
        {album.coverUrl ? <div className="cover big imageCover" style={{ backgroundImage: `url(${album.coverUrl})` }} /> : <div className="cover big"><span>{album.title.slice(0, 1)}</span></div>}
        <div>
          <p className="eyebrow">{album.genre} · {album.year}</p>
          <h1>{album.title}</h1>
          <p className="lead">{album.artist}</p>
          <p className="stars large">{album.rating ? '★'.repeat(Math.floor(album.rating)) : '별점 대기'}{album.rating % 1 ? '½' : ''} <span>{ratingText} · 리뷰 {album.reviews}</span></p>
          <div className="ratingPanel">
            <div><b>{ratingText}</b><span>평균 별점</span></div>
            <MyAlbumRating albumId={album.id} writeHref={writeHref} />
            <div><b>{album.reviews}</b><span>기록한 리스너</span></div>
          </div>
          <div className="ratingDistribution" aria-label="별점 분포">
            {distribution.map((item) => (
              <div key={item.score}>
                <span>{item.score}점</span>
                <i><b style={{ width: `${(item.count / maxDistributionCount) * 100}%` }} /></i>
                <em>{item.count}</em>
              </div>
            ))}
          </div>
          {saved ? (
            <div className="saveProgressNotice">
              <b>기록이 저장되었습니다.</b>
              <span>이 기록은 music_tags와 Beyond 진행도 계산에 반영됩니다. 아래 리뷰 목록과 내 프로필의 Beyond 요약에서 변화를 확인할 수 있습니다.</span>
            </div>
          ) : null}
          <p className="bodyText">{album.description}</p>
          {routeHint ? (
            <div className="albumRouteBox">
              <span>Archive / Beyond Route</span>
              <b>{routeHint.genre} Freshman Route와 연결될 수 있습니다.</b>
              <a href={routeHint.href}>Beyond에서 보기 →</a>
            </div>
          ) : null}
          <div className="tags">{album.mood.map((tag) => <span key={tag}>{tag}</span>)}</div>
          <div className="quickRating" aria-label="별점 입력 미리보기">
            {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((score) => <span key={score}>{score}</span>)}
          </div>
          <div className="heroActions">
            <a className="primary" href={writeHref}>이 앨범 기록하기</a>
            {album.externalUrl ? <a className="secondary spotifyButton" href={album.externalUrl} target="_blank" rel="noreferrer">Spotify에서 듣기</a> : null}
            <a className="secondary" href="/search">다른 음악 찾기</a>
          </div>
        </div>
      </section>
      <section className="section topTight narrow">
        <div className="sectionTitle"><h2>이 앨범의 감상</h2></div>
        <div className="feedList">{albumReviews.length ? albumReviews.map((review) => <ReviewCard key={review.id} review={review} />) : <p className="empty">아직 감상이 없습니다. 첫 기록을 남겨보세요.</p>}</div>
      </section>
      <section className="section topTight narrow">
        <div className="sectionTitle">
          <div>
            <p className="eyebrow">comments</p>
            <h2>함께 남긴 말</h2>
          </div>
        </div>
        <AlbumComments albumId={album.id} initialComments={comments} />
      </section>
    </main>
  );
}
