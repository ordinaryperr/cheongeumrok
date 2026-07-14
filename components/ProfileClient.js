'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import EditableReviewCard from './EditableReviewCard';
import { supabase } from '../lib/supabase';

function formatTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function mapReview(review) {
  const target = review.albums || review.tracks;

  return {
    id: review.id,
    user: 'me',
    rating: Number(review.rating),
    oneLiner: review.one_liner || '',
    body: review.body || '',
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

export default function ProfileClient() {
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      if (!supabase) {
        setStatus('error');
        setMessage('Supabase 설정이 필요합니다.');
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData?.user;

      if (!mounted) return;

      if (!currentUser) {
        setUser(null);
        setReviews([]);
        setStatus('signedOut');
        return;
      }

      setUser(currentUser);

      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          one_liner,
          body,
          created_at,
          albums:album_id (id, title, artist, cover_url),
          tracks:track_id (id, title, artist, albums:album_id (cover_url))
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (!mounted) return;

      if (error) {
        setStatus('error');
        setMessage(error.message);
        return;
      }

      setReviews(data?.map(mapReview) || []);
      setStatus('done');
    }

    loadProfile();

    const { data: listener } = supabase?.auth.onAuthStateChange(() => {
      loadProfile();
    }) || { data: null };

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const averageRating = useMemo(() => {
    if (!reviews.length) return '0.0';
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  if (status === 'loading') {
    return (
      <section className="section topTight narrow">
        <p className="empty">내 기록을 불러오는 중입니다.</p>
      </section>
    );
  }

  if (status === 'signedOut') {
    return (
      <section className="section topTight narrow">
        <div className="emptyState">
          <p className="eyebrow">my archive</p>
          <h2>내 청음 기록은 로그인 후 쌓입니다.</h2>
          <p>좋아하는 앨범과 곡을 검색하고 별점과 감상을 남기면 이곳에서 다시 볼 수 있어요.</p>
          <div className="heroActions">
            <Link className="primary" href="/login">로그인하기</Link>
            <Link className="secondary" href="/search">음악 먼저 둘러보기</Link>
          </div>
        </div>
      </section>
    );
  }

  function handleDeleted(reviewId) {
    setReviews((items) => items.filter((item) => item.id !== reviewId));
  }

  function handleUpdated(nextReview) {
    setReviews((items) => items.map((item) => item.id === nextReview.id ? nextReview : item));
  }

  return (
    <>
      <section className="profileHero">
        <div className="avatar">{user?.email?.slice(0, 1).toUpperCase() || '청'}</div>
        <div>
          <p className="eyebrow">my archive</p>
          <h1>@{user?.email?.split('@')[0] || 'listener'}</h1>
          <p className="lead">기록한 음악 {reviews.length}개 · 평균 별점 {averageRating} · 취향의 울타리를 넓히는 중</p>
        </div>
      </section>
      <section className="section topTight narrow">
        {status === 'error' ? <p className="empty">내 기록을 불러오지 못했습니다. {message}</p> : null}
        <div className="stats">
          <div><b>{reviews.length}</b><span>기록</span></div>
          <div><b>{averageRating}</b><span>평균 별점</span></div>
          <div><b>0</b><span>리스트</span></div>
        </div>
        {reviews.length ? null : (
          <div className="emptyState">
            <p className="eyebrow">start archive</p>
            <h2>아직 첫 기록이 없습니다.</h2>
            <p>방금 들은 앨범이나 오래 좋아한 곡을 검색하고, 별점과 한줄평으로 청음록을 시작해보세요.</p>
            <div className="heroActions"><Link className="primary" href="/search">첫 음악 검색하기</Link></div>
          </div>
        )}
        <div className="feedList">{reviews.map((review) => <EditableReviewCard key={review.id} review={review} onDeleted={handleDeleted} onUpdated={handleUpdated} />)}</div>
      </section>
    </>
  );
}
