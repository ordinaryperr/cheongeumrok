'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function LoginForm() {
  const router = useRouter();
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

    const { error } = await request;

    if (error) {
      setStatus('error');
      setMessage(error.message);
      return;
    }

    setStatus('done');

    if (mode === 'signin') {
      router.replace('/write');
      router.refresh();
      return;
    }

    setMessage('회원가입이 완료되었습니다. 이메일 확인이 필요할 수 있습니다. 확인 후 로그인해 주세요.');
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
