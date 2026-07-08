'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthNav() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user || null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  }

  if (loading) {
    return <span className="authState">확인중</span>;
  }

  if (!user) {
    return <Link className="loginLink" href="/login">로그인</Link>;
  }

  return (
    <div className="authNav">
      <span className="authState">{user.email}</span>
      <button type="button" onClick={handleSignOut}>로그아웃</button>
    </div>
  );
}
