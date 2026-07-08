'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

function formatTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

export default function AlbumComments({ albumId, initialComments = [] }) {
  const [user, setUser] = useState(null);
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => setUser(data.user || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;

    if (!supabase) {
      setStatus('error');
      setMessage('Supabase 설정이 필요합니다.');
      return;
    }

    if (!user) {
      setStatus('error');
      setMessage('댓글을 남기려면 로그인해야 합니다.');
      return;
    }

    setStatus('saving');
    setMessage('');

    const { data, error } = await supabase
      .from('album_comments')
      .insert({ album_id: albumId, user_id: user.id, body: text })
      .select('id, album_id, user_id, body, created_at')
      .single();

    if (error) {
      setStatus('error');
      setMessage(error.message);
      return;
    }

    setComments((items) => [{
      id: data.id,
      albumId: data.album_id,
      userId: data.user_id,
      user: user.email?.split('@')[0] || 'me',
      body: data.body,
      createdAt: formatTime(data.created_at),
    }, ...items]);
    setBody('');
    setStatus('done');
    setMessage('댓글이 등록되었습니다.');
  }

  async function handleDelete(commentId) {
    if (!supabase) return;
    const ok = window.confirm('댓글을 삭제할까요?');
    if (!ok) return;

    const { error } = await supabase.from('album_comments').delete().eq('id', commentId);

    if (error) {
      setStatus('error');
      setMessage(error.message);
      return;
    }

    setComments((items) => items.filter((item) => item.id !== commentId));
  }

  return (
    <>
      <div className="commentList">
        {comments.length ? comments.map((comment) => (
          <article className="commentCard" key={comment.id}>
            <div className="reviewMeta"><b>@{comment.user}</b><span>{comment.createdAt}</span></div>
            <p>{comment.body}</p>
            {user?.id === comment.userId ? (
              <div className="reviewActions"><button type="button" onClick={() => handleDelete(comment.id)}>삭제</button></div>
            ) : null}
          </article>
        )) : <p className="empty">아직 댓글이 없습니다. 첫 감상을 남겨보세요.</p>}
      </div>
      <form className="commentComposer" onSubmit={handleSubmit}>
        <input value={body} onChange={(event) => setBody(event.target.value)} placeholder="이 앨범을 듣고 떠오른 말, 추천 트랙, 다른 장르 연결점을 남겨보세요." />
        <button type="submit" className="secondary" disabled={status === 'saving'}>{status === 'saving' ? '등록 중' : '댓글 남기기'}</button>
      </form>
      {message ? <p className={`formMessage ${status}`}>{message} {status === 'error' && message.includes('로그인') ? <a href="/login">로그인하기</a> : null}</p> : null}
    </>
  );
}
