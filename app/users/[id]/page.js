import AppHeader from '../../../components/AppHeader';
import ReviewCard from '../../../components/ReviewCard';
import { extractTasteSignals } from '../../../lib/taste';
import { supabase } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

function formatTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function mapReview(review, profile) {
  const target = review.albums || review.tracks;
  const username = profile?.username || review.user_id?.slice(0, 8) || 'listener';

  return {
    id: review.id,
    user: username,
    userId: review.user_id,
    rating: Number(review.rating),
    text: review.one_liner || review.body || '감상을 남겼습니다.',
    body: review.body || '',
    createdAt: formatTime(review.created_at),
    album: {
      id: target?.id || review.id,
      title: target?.title || 'Unknown Music',
      artist: target?.artist || 'Unknown Artist',
      coverUrl: target?.cover_url || target?.albums?.cover_url || null,
    },
  };
}

async function getUserPageData(id) {
  if (!supabase) return null;

  const [{ data: profile }, { data: reviews, error }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, username, display_name, bio, avatar_url, created_at')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('reviews')
      .select(`
        id,
        user_id,
        rating,
        one_liner,
        body,
        created_at,
        albums:album_id (id, title, artist, cover_url, release_date, album_type),
        tracks:track_id (id, title, artist, albums:album_id (cover_url))
      `)
      .eq('user_id', id)
      .eq('is_public', true)
      .order('created_at', { ascending: false }),
  ]);

  if (error) return { profile, reviews: [] };
  return { profile, reviews: reviews || [] };
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const data = await getUserPageData(id);
  const name = data?.profile?.display_name || data?.profile?.username || id.slice(0, 8);
  return { title: `@${name} | 청음록` };
}

export default async function PublicUserPage({ params }) {
  const { id } = await params;
  const data = await getUserPageData(id);

  if (!data) {
    return (
      <main>
        <AppHeader />
        <section className="section topTight narrow"><p className="empty">사용자 정보를 불러올 수 없습니다.</p></section>
      </main>
    );
  }

  const profile = data.profile || { id, username: id.slice(0, 8), display_name: id.slice(0, 8) };
  const reviews = data.reviews.map((review) => mapReview(review, profile));
  const averageRating = reviews.length
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : '0.0';
  const taste = extractTasteSignals(data.reviews);

  return (
    <main>
      <AppHeader />
      <section className="profileHero publicProfileHero">
        <div className="avatar">{(profile.display_name || profile.username || '청').slice(0, 1).toUpperCase()}</div>
        <div>
          <p className="eyebrow">public listener profile</p>
          <h1>@{profile.display_name || profile.username}</h1>
          <p className="lead">기록 {reviews.length}개 · 평균 별점 {averageRating} · 주요 신호 {taste.primaryGenre || '아직 없음'}</p>
          {profile.bio ? <p className="bodyText">{profile.bio}</p> : null}
        </div>
      </section>

      <section className="section topTight narrow">
        <div className="stats">
          <div><b>{reviews.length}</b><span>공개 기록</span></div>
          <div><b>{averageRating}</b><span>평균 별점</span></div>
          <div><b>{taste.primaryGenre || '—'}</b><span>주요 취향</span></div>
        </div>

        {reviews.length ? (
          <div className="profileTastePanel">
            <div>
              <p className="eyebrow">taste signals</p>
              <h2>이 리스너의 취향 신호</h2>
            </div>
            <div className="tasteSignalGrid">
              {['genre', 'mood', 'texture', 'era'].map((dimension) => (
                <div key={dimension}>
                  <b>{dimension}</b>
                  {(taste.top[dimension] || []).slice(0, 4).map((item) => <span key={item.value}>{item.value} · {item.score}</span>)}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="sectionTitle">
          <div>
            <p className="eyebrow">recent records</p>
            <h2>최근 청음 기록</h2>
          </div>
        </div>
        <div className="feedList">
          {reviews.length ? reviews.map((review) => <ReviewCard key={review.id} review={review} />) : <p className="empty">아직 공개 기록이 없습니다.</p>}
        </div>
      </section>
    </main>
  );
}
