'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { logEvent } from '../lib/events';
import { supabase } from '../lib/supabase';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  const nextPath = next?.startsWith('/') && !next.startsWith('//') ? next : '/write';
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    if (!supabase) {
      setStatus('error');
      setMessage('Supabase 설정이 필요합니다.');
      return;
    }

    const request = mode === 'signin'
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password });

    const { data, error } = await request;

    if (error) {
      setStatus('error');
      setMessage(error.message);
      return;
    }

    setStatus('done');
    logEvent(mode === 'signin' ? 'login' : 'signup', { userId: data?.user?.id || null });

    if (mode === 'signin') {
      router.replace(nextPath);
      router.refresh();
      return;
    }

    setMessage('회원가입이 완료되었습니다. 기록 화면으로 이동합니다.');
    router.replace(nextPath);
    router.refresh();
  }

  return (
    <form className="writeForm" onSubmit={handleSubmit}>
      <div className="authTabs">
        <button type="button" className={mode === 'signin' ? 'selected' : ''} onClick={() => setMode('signin')}>로그인</button>
        <button type="button" className={mode === 'signup' ? 'selected' : ''} onClick={() => setMode('signup')}>회원가입</button>
      </div>
      <label>이메일<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
      <label>비밀번호<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="6자 이상" required /></label>
      <button className="primary full" disabled={status === 'loading'}>{status === 'loading' ? '처리 중...' : mode === 'signin' ? '로그인하기' : '회원가입하기'}</button>
      {message ? <p className={`formMessage ${status}`}>{message}</p> : null}
    </form>
  );
}
