'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function FollowButton({ targetUserId }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [following, setFollowing] = useState(false);
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadFollowState() {
      if (!supabase || !targetUserId) {
        setStatus('idle');
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user || null;
      setCurrentUser(user);

      if (!user || user.id === targetUserId) {
        setStatus('idle');
        return;
      }

      const { data } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle();

      setFollowing(Boolean(data));
      setStatus('idle');
    }

    loadFollowState();
  }, [targetUserId]);

  async function handleFollowToggle() {
    if (!supabase) return;
    setMessage('');

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      setMessage('팔로우하려면 로그인해야 합니다.');
      return;
    }

    if (user.id === targetUserId) return;

    setCurrentUser(user);
    setStatus('saving');

    if (following) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (error) {
        setMessage(error.message);
      } else {
        setFollowing(false);
      }
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: targetUserId });

      if (error) {
        setMessage(error.message);
      } else {
        setFollowing(true);
      }
    }

    setStatus('idle');
  }

  if (currentUser?.id === targetUserId) {
    return <span className="followSelf">내 프로필</span>;
  }

  return (
    <div className="followBox">
      <button type="button" className={following ? 'followButton following' : 'followButton'} onClick={handleFollowToggle} disabled={status === 'saving'}>
        {status === 'saving' ? 'Saving...' : following ? 'Following' : 'Follow'}
      </button>
      {message ? <p className="socialMessage">{message}</p> : null}
    </div>
  );
}
