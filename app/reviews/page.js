import Link from 'next/link';
import AppHeader from '../../components/AppHeader';
import ReviewCard from '../../components/ReviewCard';
import { reviews as mockReviews } from '../../data/mock';
import { getPublicReviews } from '../../lib/reviews';
import { parseOntologyTags } from '../../lib/taste';
import { supabase } from '../../lib/supabase';

export const metadata = { title: '리뷰 피드 | 청음록' };

function formatTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

async function getEngagementCounts(reviewIds) {
  if (!supabase || reviewIds.length === 0) return new Map();

  const [likesResult, commentsResult] = await Promise.all([
    supabase.from('review_likes').select('review_id').in('review_id', reviewIds),
    supabase.from('review_comments').select('review_id').in('review_id', reviewIds),
  ]);

  const counts = new Map(reviewIds.map((id) => [id, { likes: 0, comments: 0 }]));
  (likesResult.data || []).forEach((item) => {
    const prev = counts.get(item.review_id) || { likes: 0, comments: 0 };
    counts.set(item.review_id, { ...prev, likes: prev.likes + 1 });
  });
  (commentsResult.data || []).forEach((item) => {
    const prev = counts.get(item.review_id) || { likes: 0, comments: 0 };
    counts.set(item.review_id, { ...prev, comments: prev.comments + 1 });
  });

  return counts;
}

function sortReviews(reviews, sort) {
  if (sort === 'likes') return [...reviews].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
  if (sort === 'comments') return [...reviews].sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
  return reviews;
}

function getReviewTags(review) {
  const fallback = parseOntologyTags(review.body || '');
  const musicTag = review.musicTag || {};
  return {
    genre: musicTag.genre || fallback.genre || '',
    mood: musicTag.mood || fallback.mood || '',
    texture: musicTag.texture || fallback.texture || '',
    difficulty: musicTag.difficulty || fallback.difficulty || '',
  };
}

function filterReviewsByTag(reviews, tag) {
  if (!tag || tag === 'All') return reviews;
  const normalized = String(tag).toLowerCase();
  return reviews.filter((review) => Object.values(review.tags || {}).some((value) => String(value).toLowerCase() === normalized));
}

function buildReviewHref({ sort, tag }) {
  const params = new URLSearchParams();
  if (sort && sort !== 'latest') params.set('sort', sort);
  if (tag && tag !== 'All') params.set('tag', tag);
  const query = params.toString();
  return query ? `/reviews?${query}` : '/reviews';
}

function mapSupabaseReview(review, engagement = {}) {
  const target = review.albums || review.tracks;
  const tags = getReviewTags(review);

  return {
    id: review.id,
    user: review.user_id?.slice(0, 8) || 'listener',
    userId: review.user_id || null,
    rating: Number(review.rating),
    text: review.one_liner || review.body || '감상을 남겼습니다.',
    body: review.body || '',
    rawBody: review.body || '',
    tags,
    createdAt: formatTime(review.created_at),
    likeCount: engagement.likes || 0,
    commentCount: engagement.comments || 0,
    album: {
      id: target?.id || review.id,
      title: target?.title || 'Unknown Music',
      artist: target?.artist || 'Unknown Artist',
      coverUrl: target?.cover_url || target?.albums?.cover_url || null,
    },
  };
}

export default async function ReviewsPage({ searchParams }) {
  const params = await searchParams;
  const sort = ['latest', 'likes', 'comments'].includes(params?.sort) ? params.sort : 'latest';
  const selectedTag = typeof params?.tag === 'string' ? params.tag : 'All';
  const { data, error } = await getPublicReviews();
  const reviewIds = (data || []).map((review) => review.id);
  const engagementCounts = await getEngagementCounts(reviewIds);
  const { data: tagData } = supabase
    ? await supabase.from('music_tags').select('target_type, target_id, genre, mood, texture, difficulty')
    : { data: [] };
  const tagMap = new Map((tagData || []).map((tag) => [`${tag.target_type}:${tag.target_id}`, tag]));
  const enrichedData = (data || []).map((review) => ({
    ...review,
    musicTag: tagMap.get(`${review.track_id ? 'track' : 'album'}:${review.track_id || review.album_id}`) || null,
  }));
  const mappedReviews = enrichedData.length
    ? enrichedData.map((review) => mapSupabaseReview(review, engagementCounts.get(review.id)))
    : mockReviews;
  const tagOptions = ['All', 'Jazz', 'Ambient', 'Post-Punk', 'R&B', 'Hip-Hop', 'Electronic', 'Freshman', 'Sophomore', 'Junior', 'Senior'];
  const reviews = sortReviews(filterReviewsByTag(mappedReviews, selectedTag), sort);

  return (
    <main>
      <AppHeader />
      <section className="pageHero small">
        <p className="eyebrow">review feed</p>
        <h1>다른 사람의 청음 기록</h1>
        <p className="lead">Letterboxd처럼 다른 사람의 감상으로 음악을 발견하는 공간.</p>
        <div className="feedTabs" aria-label="리뷰 피드 탭">
          <Link className="active" href="/reviews">All Reviews</Link>
          <Link href="/following">Following</Link>
        </div>
        <div className="sortTabs" aria-label="리뷰 정렬">
          <Link className={sort === 'latest' ? 'active' : ''} href={buildReviewHref({ sort: 'latest', tag: selectedTag })}>Latest</Link>
          <Link className={sort === 'likes' ? 'active' : ''} href={buildReviewHref({ sort: 'likes', tag: selectedTag })}>Most Liked</Link>
          <Link className={sort === 'comments' ? 'active' : ''} href={buildReviewHref({ sort: 'comments', tag: selectedTag })}>Most Commented</Link>
        </div>
        <div className="tagFilterTabs" aria-label="리뷰 태그 필터">
          {tagOptions.map((tag) => (
            <Link className={selectedTag === tag ? 'active' : ''} href={buildReviewHref({ sort, tag })} key={tag}>{tag}</Link>
          ))}
        </div>
        <p className="feedHelper">리뷰 카드와 필터의 태그는 music_tags 테이블을 우선 사용하고, 없으면 감상문 속 청음 태그를 읽습니다.</p>
      </section>
      <section className="section topTight narrow">
        {error ? <p className="empty">Supabase 피드를 불러오지 못해 더미 감상을 보여주고 있습니다.</p> : null}
        <div className="feedList">{reviews.length ? reviews.map((review) => <ReviewCard key={review.id} review={review} />) : <p className="empty">선택한 태그의 리뷰가 아직 없습니다.</p>}</div>
      </section>
    </main>
  );
}
