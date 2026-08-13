'use client';

import { useEffect, useMemo, useState } from 'react';
import { curriculumTracks } from '../data/beyondYourFence';
import { calculateLevelProgress, extractTasteSignals, normalizeMusicTagRecord, personalizeCurriculumTracks } from '../lib/taste';
import { supabase } from '../lib/supabase';

export default function BeyondCurriculumClient() {
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    async function loadReviews() {
      if (!supabase) {
        setStatus('static');
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        setStatus('guest');
        return;
      }

      const { data, error } = await supabase
        .from('reviews')
        .select('id, rating, one_liner, body, created_at, album_id, track_id, albums:album_id(id, title, artist, release_date, album_type), tracks:track_id(id, title, artist)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(120);

      if (error) {
        setStatus('static');
        return;
      }

      const { data: tagData } = await supabase
        .from('music_tags')
        .select('target_type, target_id, genre, mood, texture, era, difficulty, adjacent_genres');

      const tagMap = new Map((tagData || []).map((tag) => [`${tag.target_type}:${tag.target_id}`, normalizeMusicTagRecord(tag)]));
      const enrichedReviews = (data || []).map((review) => ({
        ...review,
        musicTag: tagMap.get(`${review.track_id ? 'track' : 'album'}:${review.track_id || review.album_id}`) || null,
      }));

      setReviews(enrichedReviews);
      setStatus('ready');
    }

    loadReviews();
  }, []);

  const taste = useMemo(() => extractTasteSignals(reviews), [reviews]);
  const tracks = useMemo(() => (
    status === 'ready' && reviews.length > 0
      ? personalizeCurriculumTracks(curriculumTracks, taste)
      : curriculumTracks
  ), [reviews, status, taste]);

  return (
    <div className="curriculumList">
      {status === 'guest' ? <p className="empty">로그인하면 기록 기반으로 커리큘럼 순서와 진행도가 개인화됩니다.</p> : null}
      {tracks.map((track) => {
        let previousComplete = true;

        return (
          <article className="curriculumTrack" key={track.id}>
            <div className="trackIntro">
              <p className="eyebrow">{track.signal}</p>
              <h2>{track.genre}</h2>
              <p>{track.reason}</p>
            </div>
            <div className="levelGrid">
              {track.levels.map((level, index) => {
                const computed = status === 'ready'
                  ? calculateLevelProgress({ track, level, reviews, previousComplete })
                  : null;
                const total = computed?.total || level.requirements.length;
                const completed = computed?.completed ?? (level.status === 'open' ? 1 : 0);
                const progress = computed?.progress ?? Math.round((completed / total) * 100);
                const unlocked = computed?.unlocked ?? level.status === 'open';
                const cardStatus = unlocked ? 'open' : 'locked';
                previousComplete = progress >= 100;

                return (
                  <div className={`levelCard ${cardStatus}`} key={level.name}>
                    <div className="levelTop">
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <em>{unlocked ? 'Open' : 'Locked'}</em>
                    </div>
                    <h3>{level.name}</h3>
                    <p>{level.description}</p>

                    <div className="semesterProgress" aria-label={`${level.name} progress`}>
                      <div className="progressMeta">
                        <b>{completed} / {total}</b>
                        <span>{progress}% complete</span>
                      </div>
                      <div className="progressBar"><i style={{ width: `${progress}%` }} /></div>
                    </div>

                    <div className="courseAlbums">
                      {level.albums.map((album) => (
                        <a key={album} href={`/search?q=${encodeURIComponent(album)}`}>
                          <b>{album}</b>
                          <small>Search / record this assignment →</small>
                        </a>
                      ))}
                    </div>
                    <div className="requirements">
                      <strong>Requirements</strong>
                      {level.requirements.map((item, requirementIndex) => {
                        const checked = computed?.checks?.[requirementIndex] ?? requirementIndex < completed;
                        return (
                          <span className={checked ? 'checked' : ''} key={item}>
                            {checked ? '☑' : '□'} {item}
                          </span>
                        );
                      })}
                    </div>

                    {unlocked ? (
                      <a className="semesterButton" href="/search">Start {level.name}</a>
                    ) : (
                      <div className="lockedHint">Complete {track.levels[index - 1]?.name || 'previous semester'} requirements to unlock.</div>
                    )}
                  </div>
                );
              })}
            </div>
          </article>
        );
      })}
    </div>
  );
}
