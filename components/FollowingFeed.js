'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ReviewCard from './ReviewCard';
import { supabase } from '../lib/supabase';

function formatTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function mapReview(review) {
  const target = review.albums || review.tracks;

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
      id: target?.id || review.id,
      title: target?.title || 'Unknown Music',
      artist: target?.artist || 'Unknown Artist',
      coverUrl: target?.cover_url || target?.albums?.cover_url || null,
    },
  };
}

export default function FollowingFeed() {
  const [status, setStatus] = useState('loading');
  const [reviews, setReviews] = useState([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadFollowingFeed() {
      if (!supabase) {
        setStatus('error');
        setMessage('Supabase 설정이 필요합니다.');
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        setStatus('signedOut');
        return;
      }

      const { data: follows, error: followError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followError) {
        setStatus('error');
        setMessage(followError.message);
        return;
      }

      const followingIds = (follows || []).map((item) => item.following_id).filter(Boolean);
      setFollowingCount(followingIds.length);

      if (followingIds.length === 0) {
        setReviews([]);
        setStatus('emptyFollowing');
        return;
      }

      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          user_id,
          rating,
          one_liner,
          body,
          created_at,
          albums:album_id (id, title, artist, cover_url),
          tracks:track_id (id, title, artist, albums:album_id (cover_url))
        `)
        .in('user_id', followingIds)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(80);

      if (error) {
        setStatus('error');
        setMessage(error.message);
        return;
      }

      setReviews((data || []).map(mapReview));
      setStatus('done');
    }

    loadFollowingFeed();
  }, []);

  if (status === 'loading') {
    return <p className="empty">팔로잉 피드를 불러오는 중입니다.</p>;
  }

  if (status === 'signedOut') {
    return (
      <div className="emptyState">
        <p className="eyebrow">following feed</p>
        <h2>로그인 후 팔로잉 피드를 볼 수 있습니다.</h2>
        <p>좋은 리뷰를 쓰는 리스너를 팔로우하면 이곳에 그들의 청음 기록이 모입니다.</p>
        <div className="heroActions"><Link className="primary" href="/login">로그인하기</Link></div>
      </div>
    );
  }

  if (status === 'emptyFollowing') {
    return (
      <div className="emptyState">
        <p className="eyebrow">following feed</p>
        <h2>아직 팔로우한 리스너가 없습니다.</h2>
        <p>리뷰 피드에서 마음에 드는 감상을 쓴 사람을 찾아 팔로우해보세요.</p>
        <div className="heroActions"><Link className="primary" href="/reviews">리뷰 피드 둘러보기</Link></div>
      </div>
    );
  }

  if (status === 'error') {
    return <p className="empty">팔로잉 피드를 불러오지 못했습니다. {message}</p>;
  }

  return (
    <>
      <div className="followingSummary">
        <div><b>{followingCount}</b><span>following listeners</span></div>
        <div><b>{reviews.length}</b><span>recent records</span></div>
      </div>
      <div className="feedList">
        {reviews.length ? reviews.map((review) => <ReviewCard key={review.id} review={review} />) : <p className="empty">팔로우한 리스너의 공개 기록이 아직 없습니다.</p>}
      </div>
    </>
  );
}
