'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

const scores = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export default function WriteReviewForm({ selectedMusic, fallbackAlbums }) {
  const router = useRouter();
  const [selectedMockId, setSelectedMockId] = useState(selectedMusic?.mockId || fallbackAlbums[0]?.id || '');
  const [rating, setRating] = useState(4.5);
  const [oneLiner, setOneLiner] = useState('');
  const [recommendedTrack, setRecommendedTrack] = useState('');
  const [body, setBody] = useState('');
  const [expansionNote, setExpansionNote] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const currentMock = fallbackAlbums.find((album) => album.id === selectedMockId) || fallbackAlbums[0];
  const music = selectedMusic || {
    type: 'album',
    mockId: currentMock.id,
    title: currentMock.title,
    artist: currentMock.artist,
    year: currentMock.year,
    coverUrl: null,
    externalUrl: null,
    releaseDate: currentMock.year,
  };

  async function upsertAlbum(item) {
    const { data, error } = await supabase
      .from('albums')
      .upsert({
        spotify_id: item.id || `mock:${item.mockId}`,
        title: item.type === 'track' ? item.album || item.title : item.title,
        artist: item.artist,
        cover_url: item.coverUrl,
        release_date: item.releaseDate || item.year || null,
        album_type: item.type === 'track' ? 'track-source' : 'album',
        external_url: item.externalUrl,
      }, { onConflict: 'spotify_id' })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  async function upsertTrack(item, albumId) {
    const { data, error } = await supabase
      .from('tracks')
      .upsert({
        spotify_id: item.id,
        album_id: albumId,
        title: item.title,
        artist: item.artist,
        duration_ms: item.durationMs,
        external_url: item.externalUrl,
      }, { onConflict: 'spotify_id' })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('saving');
    setMessage('');

    if (!supabase) {
      setStatus('error');
      setMessage('Supabase 설정이 필요합니다.');
      return;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData?.user;

    if (userError || !user) {
      setStatus('error');
      setMessage('기록을 저장하려면 먼저 로그인해야 합니다.');
      return;
    }

    try {
      const albumId = await upsertAlbum(music);
      const trackId = music.type === 'track' ? await upsertTrack(music, albumId) : null;
      const reviewBody = [body, recommendedTrack && `추천 트랙: ${recommendedTrack}`, expansionNote && `취향 확장 메모: ${expansionNote}`]
        .filter(Boolean)
        .join('\n\n');

      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          album_id: music.type === 'album' ? albumId : null,
          track_id: music.type === 'track' ? trackId : null,
          rating,
          one_liner: oneLiner,
          body: reviewBody,
          is_public: true,
        });

      if (error) throw error;

      setStatus('done');
      setMessage('기록이 저장되었습니다. 내 기록으로 이동합니다.');
      setOneLiner('');
      setRecommendedTrack('');
      setBody('');
      setExpansionNote('');
      router.replace('/profile');
      router.refresh();
    } catch (error) {
      setStatus('error');
      setMessage(error.message || '저장 중 문제가 생겼습니다.');
    }
  }

  return (
    <form className="writeForm" onSubmit={handleSubmit}>
      <label>선택한 음악
        <input value={`${music.title} - ${music.artist}`} readOnly />
      </label>
      {selectedMusic ? (
        <>
          <input type="hidden" name="spotifyId" value={selectedMusic.id} />
          <input type="hidden" name="targetType" value={selectedMusic.type} />
        </>
      ) : (
        <label>더미 앨범 선택
          <select value={selectedMockId} onChange={(event) => setSelectedMockId(event.target.value)}>
            {fallbackAlbums.map((album) => <option value={album.id} key={album.id}>{album.title} - {album.artist}</option>)}
          </select>
        </label>
      )}
      <label>별점
        <div className="ratingChoices">
          {scores.map((score) => (
            <button type="button" className={score === rating ? 'selected' : ''} key={score} onClick={() => setRating(score)}>{score}</button>
          ))}
        </div>
      </label>
      <label>한줄평<input value={oneLiner} onChange={(event) => setOneLiner(event.target.value)} placeholder="이 음악을 한 문장으로 남긴다면" /></label>
      <label>추천 트랙<input value={recommendedTrack} onChange={(event) => setRecommendedTrack(event.target.value)} placeholder="처음 듣는 사람에게 먼저 들려주고 싶은 곡" /></label>
      <label>감상문<textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="들으면서 떠오른 장면, 감정, 문장, 다른 장르로 이어지는 생각을 적어보세요." /></label>
      <label>취향 확장 메모<input value={expansionNote} onChange={(event) => setExpansionNote(event.target.value)} placeholder="이 앨범이 내 울타리를 어떻게 넓혔나요?" /></label>
      <button type="submit" className="primary full" disabled={status === 'saving'}>{status === 'saving' ? '저장 중...' : '기록 저장하기'}</button>
      {message ? <p className={`formMessage ${status}`}>{message} {status === 'error' && message.includes('로그인') ? <a href="/login">로그인하러 가기</a> : null}</p> : null}
    </form>
  );
}
