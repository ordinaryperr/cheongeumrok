import AppHeader from '../../../components/AppHeader';
import FollowButton from '../../../components/FollowButton';
import ReviewCard from '../../../components/ReviewCard';
import { curriculumTracks } from '../../../data/beyondYourFence';
import { calculateLevelProgress, extractTasteSignals, normalizeMusicTagRecord } from '../../../lib/taste';
import { supabase } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

function genreParam(value = '') {
  return String(value).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function buildBeyondSummary(reviews) {
  if (!reviews.length) return [];
  return curriculumTracks.map((track) => {
    const freshman = track.levels[0];
    const progress = calculateLevelProgress({ track, level: freshman, reviews, previousComplete: true });
    return {
      id: genreParam(track.genre),
      genre: track.genre,
      completed: progress.completed,
      total: progress.total,
      progress: progress.progress,
      relatedCount: progress.relatedCount,
      completedBadge: progress.progress >= 100,
    };
  })
    .filter((item) => item.progress > 0 || item.relatedCount > 0)
    .sort((a, b) => b.progress - a.progress || b.relatedCount - a.relatedCount)
    .slice(0, 4);
}

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
    created_at: review.created_at,
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

  const [{ data: profile }, { data: reviews, error }, { count: followerCount }, { count: followingCount }] = await Promise.all([
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
        album_id,
        track_id,
        albums:album_id (id, title, artist, cover_url, release_date, album_type),
        tracks:track_id (id, title, artist, albums:album_id (cover_url))
      `)
      .eq('user_id', id)
      .eq('is_public', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', id),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', id),
  ]);

  if (error) return { profile, reviews: [], followerCount: followerCount || 0, followingCount: followingCount || 0 };

  const { data: tagData } = await supabase
    .from('music_tags')
    .select('target_type, target_id, genre, mood, texture, era, difficulty, adjacent_genres');
  const tagMap = new Map((tagData || []).map((tag) => [`${tag.target_type}:${tag.target_id}`, normalizeMusicTagRecord(tag)]));
  const enrichedReviews = (reviews || []).map((review) => ({
    ...review,
    musicTag: tagMap.get(`${review.track_id ? 'track' : 'album'}:${review.track_id || review.album_id}`) || null,
  }));

  return { profile, reviews: enrichedReviews, followerCount: followerCount || 0, followingCount: followingCount || 0 };
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
  const beyondSummary = buildBeyondSummary(data.reviews);

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
          <div className="heroActions"><FollowButton targetUserId={profile.id} /></div>
        </div>
      </section>

      <section className="section topTight narrow">
        <div className="stats">
          <div><b>{reviews.length}</b><span>공개 기록</span></div>
          <div><b>{averageRating}</b><span>평균 별점</span></div>
          <div><b>{taste.primaryGenre || '—'}</b><span>주요 취향</span></div>
          <div><b>{data.followerCount}</b><span>팔로워</span></div>
          <div><b>{data.followingCount}</b><span>팔로잉</span></div>
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
            {beyondSummary.length ? (
              <div className="profileBeyondSummary publicBeyondSummary">
                <p className="eyebrow">Beyond route</p>
                {beyondSummary.some((route) => route.completedBadge) ? (
                  <div className="beyondBadgeShelf">
                    {beyondSummary.filter((route) => route.completedBadge).map((route) => (
                      <span key={`badge-${route.id}`}>🏅 {route.genre} Freshman Completed</span>
                    ))}
                  </div>
                ) : null}
                {beyondSummary.map((route) => (
                  <a href={`/beyond-your-fence?genre=${route.id}#${route.id}`} key={route.id}>
                    <b>{route.genre}</b>
                    <span>{route.completedBadge ? 'Completed badge earned · ' : ''}{route.completed}/{route.total} checks · {route.progress}% Freshman</span>
                    <i><em style={{ width: `${route.progress}%` }} /></i>
                  </a>
                ))}
              </div>
            ) : null}
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
