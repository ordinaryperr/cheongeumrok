'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value));
}

function formatCommentTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

export default function ReviewCard({ review }) {
  const canInteract = useMemo(() => Boolean(supabase && isUuid(review.id)), [review.id]);
  const [user, setUser] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!canInteract) return;
    let mounted = true;

    async function loadSocialState() {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData?.user || null;
      if (!mounted) return;
      setUser(currentUser);

      const [{ count }, { data: commentData }] = await Promise.all([
        supabase
          .from('review_likes')
          .select('*', { count: 'exact', head: true })
          .eq('review_id', review.id),
        supabase
          .from('review_comments')
          .select('id, body, created_at, user_id')
          .eq('review_id', review.id)
          .order('created_at', { ascending: true })
          .limit(6),
      ]);

      if (!mounted) return;
      setLikeCount(count || 0);
      setComments(commentData || []);

      if (currentUser) {
        const { data: likeData } = await supabase
          .from('review_likes')
          .select('review_id')
          .eq('review_id', review.id)
          .eq('user_id', currentUser.id)
          .maybeSingle();
        if (mounted) setLiked(Boolean(likeData));
      }
    }

    loadSocialState();
    return () => { mounted = false; };
  }, [canInteract, review.id]);

  async function handleLike() {
    if (!canInteract) return;
    setMessage('');

    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData?.user;
    if (!currentUser) {
      setMessage('좋아요를 누르려면 로그인해야 합니다.');
      return;
    }

    setUser(currentUser);
    setStatus('saving');

    if (liked) {
      const { error } = await supabase
        .from('review_likes')
        .delete()
        .eq('review_id', review.id)
        .eq('user_id', currentUser.id);

      if (!error) {
        setLiked(false);
        setLikeCount((count) => Math.max(0, count - 1));
      } else {
        setMessage(error.message);
      }
    } else {
      const { error } = await supabase
        .from('review_likes')
        .insert({ review_id: review.id, user_id: currentUser.id });

      if (!error) {
        setLiked(true);
        setLikeCount((count) => count + 1);
      } else {
        setMessage(error.message);
      }
    }

    setStatus('idle');
  }

  async function handleCommentSubmit(event) {
    event.preventDefault();
    if (!canInteract || !commentBody.trim()) return;
    setMessage('');

    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData?.user;
    if (!currentUser) {
      setMessage('댓글을 남기려면 로그인해야 합니다.');
      return;
    }

    setUser(currentUser);
    setStatus('saving');

    const { data, error } = await supabase
      .from('review_comments')
      .insert({ review_id: review.id, user_id: currentUser.id, body: commentBody.trim() })
      .select('id, body, created_at, user_id')
      .single();

    if (error) {
      setMessage(error.message);
    } else {
      setComments((items) => [...items, data]);
      setCommentBody('');
      setCommentOpen(true);
    }

    setStatus('idle');
  }

  return (
    <article className="reviewCard compact">
      <Link
        className={`miniCover ${review.album.coverUrl ? 'imageCover' : ''}`}
        href={`/albums/${review.album.id}`}
        style={review.album.coverUrl ? { backgroundImage: `url(${review.album.coverUrl})` } : undefined}
      >
        <span>{review.album.coverUrl ? '' : review.album.title.slice(0, 1)}</span>
      </Link>
      <div>
        <div className="reviewMeta">
          {review.userId ? <Link href={`/users/${review.userId}`}><b>@{review.user}</b></Link> : <b>@{review.user}</b>}
          <span>{review.createdAt}</span>
        </div>
        <Link href={`/albums/${review.album.id}`}><h3>{review.album.title}</h3></Link>
        <p className="artist">{review.album.artist}</p>
        <p className="stars">{'★'.repeat(Math.floor(review.rating))}{review.rating % 1 ? '½' : ''} <span>{review.rating.toFixed(1)}</span></p>
        <p className="reviewText">{review.text}</p>
        <div className="reviewActions">
          <button type="button" onClick={handleLike} disabled={!canInteract || status === 'saving'}>{liked ? '좋아요 취소' : '좋아요'} {likeCount}</button>
          <button type="button" onClick={() => setCommentOpen((open) => !open)} disabled={!canInteract}>댓글 {comments.length}</button>
          {canInteract ? <Link href={`/reviews/${review.id}`}>리뷰 보기</Link> : null}
          <Link href={`/albums/${review.album.id}`}>앨범 보기</Link>
        </div>
        {!canInteract ? <p className="socialMessage">샘플 리뷰는 좋아요/댓글을 사용할 수 없습니다.</p> : null}
        {message ? <p className="socialMessage">{message}</p> : null}
        {commentOpen && canInteract ? (
          <div className="commentThread">
            {comments.length ? comments.map((comment) => (
              <div className="inlineComment" key={comment.id}>
                <b>{comment.user_id === user?.id ? 'me' : 'listener'}</b>
                <span>{formatCommentTime(comment.created_at)}</span>
                <p>{comment.body}</p>
              </div>
            )) : <p className="socialMessage">아직 댓글이 없습니다. 첫 의견을 남겨보세요.</p>}
            <form className="inlineCommentForm" onSubmit={handleCommentSubmit}>
              <input value={commentBody} onChange={(event) => setCommentBody(event.target.value)} placeholder="이 감상에 대한 의견을 남겨보세요." />
              <button type="submit" disabled={status === 'saving' || !commentBody.trim()}>{status === 'saving' ? '등록 중' : '댓글'}</button>
            </form>
          </div>
        ) : null}
      </div>
    </article>
  );
}
