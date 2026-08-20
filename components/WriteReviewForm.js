'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { musicTagSchema } from '../data/musicOntology';
import { inferMusicTags, normalizeMusicTagRecord } from '../lib/taste';
import { logEvent } from '../lib/events';
import { syncUserTasteSignals } from '../lib/userTasteSignals';
import { supabase } from '../lib/supabase';

const scores = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export default function WriteReviewForm({ selectedMusic, fallbackAlbums }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedMockId, setSelectedMockId] = useState(selectedMusic?.mockId || fallbackAlbums[0]?.id || '');
  const [rating, setRating] = useState(4.5);
  const [oneLiner, setOneLiner] = useState('');
  const [recommendedTrack, setRecommendedTrack] = useState('');
  const [body, setBody] = useState('');
  const [expansionNote, setExpansionNote] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [authStatus, setAuthStatus] = useState('checking');

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
  const inferredTags = inferMusicTags(music);
  const [genreTag, setGenreTag] = useState(inferredTags.genre[0] || musicTagSchema.genre[0]);
  const [moodTag, setMoodTag] = useState(inferredTags.mood[0] === 'unclassified' ? musicTagSchema.mood[0] : inferredTags.mood[0]);
  const [textureTag, setTextureTag] = useState(inferredTags.texture[0] === 'unclassified' ? musicTagSchema.texture[0] : inferredTags.texture[0]);
  const [difficultyTag, setDifficultyTag] = useState('Freshman');
  const queryString = searchParams.toString();
  const nextPath = `${pathname}${queryString ? `?${queryString}` : ''}`;
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      if (!supabase) {
        setAuthStatus('unconfigured');
        return;
      }

      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setAuthStatus(data?.user ? 'signedIn' : 'signedOut');
    }

    checkAuth();

    const { data: listener } = supabase?.auth.onAuthStateChange((_event, session) => {
      setAuthStatus(session?.user ? 'signedIn' : 'signedOut');
    }) || { data: null };

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

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

  async function upsertMusicTags({ albumId, trackId, tags }) {
    const targetType = trackId ? 'track' : 'album';
    const targetId = trackId || albumId;

    const { error } = await supabase
      .from('music_tags')
      .upsert({
        target_type: targetType,
        target_id: targetId,
        genre: tags.genre || null,
        mood: tags.mood || null,
        texture: tags.texture || null,
        era: tags.era || null,
        difficulty: tags.difficulty || null,
        adjacent_genres: tags.adjacentGenres || [],
      }, { onConflict: 'target_type,target_id' });

    if (error) throw error;
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
      const ontologyTags = {
        genre: genreTag,
        mood: moodTag,
        texture: textureTag,
        era: inferredTags.era[0] || '',
        difficulty: difficultyTag,
        adjacentGenres: inferredTags.adjacentGenres,
      };
      const reviewBody = [
        body,
        `청음 태그: genre=${ontologyTags.genre}; mood=${ontologyTags.mood}; texture=${ontologyTags.texture}; era=${ontologyTags.era}; difficulty=${ontologyTags.difficulty}; adjacentGenres=${ontologyTags.adjacentGenres.join(', ')}`,
        recommendedTrack && `추천 트랙: ${recommendedTrack}`,
        expansionNote && `취향 확장 메모: ${expansionNote}`,
      ]
        .filter(Boolean)
        .join('\n\n');

      const { data: savedReview, error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          album_id: music.type === 'album' ? albumId : null,
          track_id: music.type === 'track' ? trackId : null,
          rating,
          one_liner: oneLiner,
          body: reviewBody,
          is_public: true,
        })
        .select('id')
        .single();

      if (error) throw error;
      logEvent('review_created', { reviewId: savedReview?.id, albumId, trackId, rating });

      try {
        await upsertMusicTags({ albumId, trackId, tags: ontologyTags });
      } catch (tagError) {
        console.warn('music_tags 저장을 건너뜁니다:', tagError.message);
      }

      try {
        const { data: userReviews } = await supabase
          .from('reviews')
          .select('id, rating, one_liner, body, created_at, album_id, track_id, albums:album_id(id, title, artist, release_date, album_type), tracks:track_id(id, title, artist)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(150);
        const { data: tagData } = await supabase
          .from('music_tags')
          .select('target_type, target_id, genre, mood, texture, era, difficulty, adjacent_genres');
        const tagMap = new Map((tagData || []).map((tag) => [`${tag.target_type}:${tag.target_id}`, normalizeMusicTagRecord(tag)]));
        const enrichedReviews = (userReviews || []).map((review) => ({
          ...review,
          musicTag: tagMap.get(`${review.track_id ? 'track' : 'album'}:${review.track_id || review.album_id}`) || null,
        }));
        const { error: tasteError } = await syncUserTasteSignals(user.id, enrichedReviews);
        if (tasteError) console.warn('user_taste_signals 저장을 건너뜁니다:', tasteError.message);
      } catch (tasteError) {
        console.warn('user_taste_signals 갱신을 건너뜁니다:', tasteError.message);
      }

      setStatus('done');
      setMessage('기록이 저장되었습니다. 앨범 페이지로 이동합니다.');
      setOneLiner('');
      setRecommendedTrack('');
      setBody('');
      setExpansionNote('');
      router.replace(`/albums/${albumId}?saved=1`);
      router.refresh();
    } catch (error) {
      setStatus('error');
      setMessage(error.message || '저장 중 문제가 생겼습니다.');
    }
  }

  if (authStatus === 'checking') {
    return <p className="empty">로그인 상태를 확인하는 중입니다.</p>;
  }

  if (authStatus === 'signedOut') {
    return (
      <div className="emptyState">
        <p className="eyebrow">login required</p>
        <h2>기록 저장은 로그인 후 가능합니다.</h2>
        <p>선택한 음악을 유지한 채 로그인한 뒤 바로 감상을 이어서 남길 수 있어요.</p>
        <div className="heroActions">
          <Link className="primary" href={loginHref}>로그인하고 기록하기</Link>
          <Link className="secondary" href="/search">다른 음악 찾기</Link>
        </div>
      </div>
    );
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
      <div className="tagSelectGrid">
        <label>Genre Signal
          <select value={genreTag} onChange={(event) => setGenreTag(event.target.value)}>
            {musicTagSchema.genre.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label>Mood Signal
          <select value={moodTag} onChange={(event) => setMoodTag(event.target.value)}>
            {musicTagSchema.mood.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label>Texture Signal
          <select value={textureTag} onChange={(event) => setTextureTag(event.target.value)}>
            {musicTagSchema.texture.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label>Difficulty
          <select value={difficultyTag} onChange={(event) => setDifficultyTag(event.target.value)}>
            {musicTagSchema.difficulty.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <label>한줄평<input value={oneLiner} onChange={(event) => setOneLiner(event.target.value)} placeholder="이 음악을 한 문장으로 남긴다면" /></label>
      <label>추천 트랙<input value={recommendedTrack} onChange={(event) => setRecommendedTrack(event.target.value)} placeholder="처음 듣는 사람에게 먼저 들려주고 싶은 곡" /></label>
      <label>감상문<textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="들으면서 떠오른 장면, 감정, 문장, 다른 장르로 이어지는 생각을 적어보세요." /></label>
      <label>취향 확장 메모<input value={expansionNote} onChange={(event) => setExpansionNote(event.target.value)} placeholder="이 앨범이 내 울타리를 어떻게 넓혔나요?" /></label>
      <button type="submit" className="primary full" disabled={status === 'saving'}>{status === 'saving' ? '저장 중...' : '기록 저장하기'}</button>
      {message ? <p className={`formMessage ${status}`}>{message} {status === 'error' && message.includes('로그인') ? <Link href={loginHref}>로그인하러 가기</Link> : null}</p> : null}
    </form>
  );
}
