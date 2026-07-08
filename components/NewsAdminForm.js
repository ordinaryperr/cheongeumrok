'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function NewsAdminForm() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('News');
  const [source, setSource] = useState('청음록 편집부');
  const [sourceUrl, setSourceUrl] = useState('');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!supabase) {
      setStatus('error');
      setMessage('Supabase 설정이 필요합니다.');
      return;
    }

    supabase.auth.getUser().then(async ({ data }) => {
      const currentUser = data.user || null;
      setUser(currentUser);

      if (!currentUser) {
        setStatus('idle');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error) {
        setStatus('error');
        setMessage(error.message);
        return;
      }

      setIsAdmin(Boolean(profile?.is_admin));
      setStatus('idle');
    });
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!user) {
      setStatus('error');
      setMessage('뉴스를 입력하려면 로그인해야 합니다.');
      return;
    }

    if (!isAdmin) {
      setStatus('error');
      setMessage('관리자만 뉴스를 등록할 수 있습니다.');
      return;
    }

    setStatus('saving');
    setMessage('');

    const { error } = await supabase.from('news_posts').insert({
      title,
      summary,
      category,
      source,
      source_url: sourceUrl || null,
    });

    if (error) {
      setStatus('error');
      setMessage(error.message);
      return;
    }

    setTitle('');
    setSummary('');
    setCategory('News');
    setSource('청음록 편집부');
    setSourceUrl('');
    setStatus('done');
    setMessage('뉴스가 등록되었습니다. /news 페이지에서 확인하세요.');
  }

  if (status === 'loading') return <p className="empty">로그인 상태를 확인하는 중입니다.</p>;

  return (
    <form className="writeForm" onSubmit={handleSubmit}>
      {!user ? <p className="empty">뉴스를 등록하려면 로그인해야 합니다. <a href="/login">로그인하기</a></p> : null}
      {user && !isAdmin ? <p className="empty">현재 계정은 뉴스 관리자 권한이 없습니다. Supabase profiles 테이블에서 이 계정의 is_admin 값을 true로 변경해 주세요.</p> : null}
      <label>제목<input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="예: 이번 주 주목할 신보" /></label>
      <label>요약<textarea value={summary} onChange={(event) => setSummary(event.target.value)} required placeholder="뉴스 카드에 표시될 짧은 설명" /></label>
      <label>카테고리<input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="New Release, Scene, Essay..." /></label>
      <label>출처<input value={source} onChange={(event) => setSource(event.target.value)} /></label>
      <label>출처 URL<input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://..." /></label>
      <button className="primary full" disabled={status === 'saving' || !user || !isAdmin}>{status === 'saving' ? '등록 중...' : '뉴스 등록하기'}</button>
      {message ? <p className={`formMessage ${status}`}>{message}</p> : null}
    </form>
  );
}
