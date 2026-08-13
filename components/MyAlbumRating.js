'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function MyAlbumRating({ albumId, writeHref }) {
  const [status, setStatus] = useState('loading');
  const [rating, setRating] = useState(null);

  useEffect(() => {
    async function loadMyRating() {
      if (!supabase || !albumId) {
        setStatus('idle');
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        setStatus('signedOut');
        return;
      }

      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('user_id', user.id)
        .eq('album_id', albumId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        setStatus('idle');
        return;
      }

      setRating(data?.rating ? Number(data.rating) : null);
      setStatus('done');
    }

    loadMyRating();
  }, [albumId]);

  if (status === 'loading') {
    return <div><b>—</b><span>내 별점 확인 중</span></div>;
  }

  if (status === 'signedOut') {
    return <div><b>—</b><span><a href="/login">로그인 후 평가</a></span></div>;
  }

  if (!rating) {
    return <div><b>—</b><span><a href={writeHref}>내 별점 남기기</a></span></div>;
  }

  return <div><b>{rating.toFixed(1)}</b><span>내 별점</span></div>;
}
