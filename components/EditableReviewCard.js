'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

const scores = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export default function EditableReviewCard({ review, onDeleted, onUpdated }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(review.rating);
  const [oneLiner, setOneLiner] = useState(review.oneLiner || review.text || '');
  const [body, setBody] = useState(review.body || '');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  async function handleDelete() {
    if (!supabase) return;
    const ok = window.confirm('이 리뷰를 삭제할까요? 삭제한 기록은 되돌릴 수 없습니다.');
    if (!ok) return;

    setStatus('saving');
    setMessage('');

    const { error } = await supabase.from('reviews').delete().eq('id', review.id);

    if (error) {
      setStatus('error');
      setMessage(error.message);
      return;
    }

    setStatus('done');
    onDeleted?.(review.id);
    router.refresh();
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!supabase) return;

    setStatus('saving');
    setMessage('');

    const { data, error } = await supabase
      .from('reviews')
      .update({ rating, one_liner: oneLiner, body })
      .eq('id', review.id)
      .select('id, rating, one_liner, body, created_at')
      .single();

    if (error) {
      setStatus('error');
      setMessage(error.message);
      return;
    }

    setStatus('done');
    setIsEditing(false);
    setMessage('수정되었습니다.');
    onUpdated?.({ ...review, rating: Number(data.rating), oneLiner: data.one_liner, body: data.body, text: data.one_liner || data.body || '감상을 남겼습니다.' });
    router.refresh();
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
        <div className="reviewMeta"><b>@{review.user}</b><span>{review.createdAt}</span></div>
        <Link href={`/albums/${review.album.id}`}><h3>{review.album.title}</h3></Link>
        <p className="artist">{review.album.artist}</p>

        {isEditing ? (
          <form className="inlineEditForm" onSubmit={handleSave}>
            <label>별점
              <div className="ratingChoices">
                {scores.map((score) => (
                  <button type="button" className={score === rating ? 'selected' : ''} key={score} onClick={() => setRating(score)}>{score}</button>
                ))}
              </div>
            </label>
            <label>한줄평
              <input value={oneLiner} onChange={(event) => setOneLiner(event.target.value)} />
            </label>
            <label>감상문
              <textarea value={body} onChange={(event) => setBody(event.target.value)} />
            </label>
            <div className="reviewActions">
              <button type="submit" disabled={status === 'saving'}>{status === 'saving' ? '저장 중' : '저장'}</button>
              <button type="button" onClick={() => setIsEditing(false)}>취소</button>
            </div>
          </form>
        ) : (
          <>
            <p className="stars">{'★'.repeat(Math.floor(review.rating))}{review.rating % 1 ? '½' : ''} <span>{review.rating.toFixed(1)}</span></p>
            <p className="reviewText">{review.text}</p>
            <div className="reviewActions">
              <button type="button" onClick={() => setIsEditing(true)}>수정</button>
              <button type="button" onClick={handleDelete} disabled={status === 'saving'}>{status === 'saving' ? '삭제 중' : '삭제'}</button>
            </div>
          </>
        )}
        {message ? <p className={`formMessage ${status}`}>{message}</p> : null}
      </div>
    </article>
  );
}
