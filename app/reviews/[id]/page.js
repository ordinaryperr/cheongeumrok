import AppHeader from '../../../components/AppHeader';
import ReviewCard from '../../../components/ReviewCard';
import { parseOntologyTags } from '../../../lib/taste';
import { supabase } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

function formatTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function cleanReviewBody(body = '') {
  return String(body).replace(/청음 태그:[\s\S]*?(?=\n\n추천 트랙:|\n\n취향 확장 메모:|$)/, '').trim();
}

function mapReview(review) {
  const target = review.albums || review.tracks;

  return {
    id: review.id,
    user: review.user_id?.slice(0, 8) || 'listener',
    userId: review.user_id || null,
    rating: Number(review.rating),
    text: review.one_liner || cleanReviewBody(review.body) || '감상을 남겼습니다.',
    body: cleanReviewBody(review.body),
    rawBody: review.body || '',
    createdAt: formatTime(review.created_at),
    album: {
      id: target?.id || review.id,
      title: target?.title || 'Unknown Music',
      artist: target?.artist || 'Unknown Artist',
      coverUrl: target?.cover_url || target?.albums?.cover_url || null,
    },
  };
}

async function getReview(id) {
  if (!supabase) return null;

  const { data, error } = await supabase
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
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const data = await getReview(id);
  if (!data) return { title: '리뷰 | 청음록' };
  const review = mapReview(data);
  return { title: `${review.album.title} 리뷰 | 청음록`, description: review.text };
}

export default async function ReviewDetailPage({ params }) {
  const { id } = await params;
  const data = await getReview(id);

  if (!data) {
    return (
      <main>
        <AppHeader />
        <section className="section topTight narrow">
          <div className="emptyState">
            <p className="eyebrow">review</p>
            <h2>리뷰를 찾을 수 없습니다.</h2>
            <p>삭제되었거나 비공개로 전환된 리뷰일 수 있습니다.</p>
            <div className="heroActions"><a className="primary" href="/reviews">리뷰 피드로 돌아가기</a></div>
          </div>
        </section>
      </main>
    );
  }

  const review = mapReview(data);
  const tags = parseOntologyTags(review.rawBody);
  const tagEntries = [
    ['genre', tags.genre],
    ['mood', tags.mood],
    ['texture', tags.texture],
    ['era', tags.era],
    ['difficulty', tags.difficulty],
  ].filter(([, value]) => value);

  return (
    <main>
      <AppHeader />
      <section className="pageHero reviewDetailHero">
        <p className="eyebrow">review detail</p>
        <h1>{review.album.title}</h1>
        <p className="lead">{review.album.artist}에 남겨진 하나의 청음 기록입니다. 별점, 문장, 댓글이 모여 음악에 대한 대화가 됩니다.</p>
        <div className="heroActions">
          <a className="primary" href={`/albums/${review.album.id}`}>앨범 페이지</a>
          <a className="secondary" href="/reviews">리뷰 피드</a>
        </div>
      </section>

      <section className="section topTight narrow">
        <ReviewCard review={review} />

        {review.body ? (
          <article className="reviewLongform">
            <p className="eyebrow">full note</p>
            <p>{review.body}</p>
          </article>
        ) : null}

        {tagEntries.length ? (
          <article className="reviewOntologyBox">
            <p className="eyebrow">ontology signals</p>
            <div className="tasteSignalGrid">
              {tagEntries.map(([key, value]) => (
                <div key={key}>
                  <b>{key}</b>
                  <span>{value}</span>
                </div>
              ))}
              {tags.adjacentGenres?.length ? (
                <div>
                  <b>adjacent</b>
                  {tags.adjacentGenres.slice(0, 4).map((item) => <span key={item}>{item}</span>)}
                </div>
              ) : null}
            </div>
          </article>
        ) : null}
      </section>
    </main>
  );
}
