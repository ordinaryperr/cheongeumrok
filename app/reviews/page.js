import AppHeader from '../../components/AppHeader';
import ReviewCard from '../../components/ReviewCard';
import { reviews as mockReviews } from '../../data/mock';
import { getPublicReviews } from '../../lib/reviews';

export const metadata = { title: '리뷰 피드 | 청음록' };

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

export default async function ReviewsPage() {
  const { data, error } = await getPublicReviews();
  const reviews = data?.length ? data.map(mapSupabaseReview) : mockReviews;

  return (
    <main>
      <AppHeader />
      <section className="pageHero small">
        <p className="eyebrow">review feed</p>
        <h1>다른 사람의 청음 기록</h1>
        <p className="lead">Letterboxd처럼 다른 사람의 감상으로 음악을 발견하는 공간.</p>
      </section>
      <section className="section topTight narrow">
        {error ? <p className="empty">Supabase 피드를 불러오지 못해 더미 감상을 보여주고 있습니다.</p> : null}
        <div className="feedList">{reviews.map((review) => <ReviewCard key={review.id} review={review} />)}</div>
      </section>
    </main>
  );
}
