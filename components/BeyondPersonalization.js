'use client';

import { useEffect, useMemo, useState } from 'react';
import { curriculumTracks } from '../data/beyondYourFence';
import { extractTasteSignals, normalizeMusicTagRecord, personalizeCurriculumTracks, scoreCurriculumTrack } from '../lib/taste';
import { supabase } from '../lib/supabase';

export default function BeyondPersonalization() {
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    async function loadTaste() {
      if (!supabase) {
        setStatus('no-config');
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
        .limit(80);

      if (error) {
        setStatus('error');
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

    loadTaste();
  }, []);

  const taste = useMemo(() => extractTasteSignals(reviews), [reviews]);
  const recommendedTracks = useMemo(() => personalizeCurriculumTracks(curriculumTracks, taste).slice(0, 3), [taste]);

  if (status === 'loading') return <p className="empty">취향 신호를 읽는 중입니다.</p>;
  if (status === 'guest') return <p className="empty">로그인하고 기록을 남기면 Beyond Your Fence가 개인 취향에 맞춰 재정렬됩니다.</p>;
  if (status === 'error') return <p className="empty">취향 신호를 불러오지 못했습니다.</p>;
  if (reviews.length === 0) return <p className="empty">아직 기록이 없습니다. 음악을 기록하면 장르, 무드, 질감 신호가 생성됩니다.</p>;

  return (
    <div className="tastePanel">
      <div>
        <p className="eyebrow">taste ontology</p>
        <h3>Your Taste Signals</h3>
        <p>기록한 음악에서 장르, 무드, 질감, 시대, 난이도 신호를 추출했습니다.</p>
      </div>
      <div className="tasteSignalGrid">
        {['genre', 'mood', 'texture', 'era'].map((dimension) => (
          <div key={dimension}>
            <b>{dimension}</b>
            {(taste.top[dimension] || []).slice(0, 4).map((item) => <span key={item.value}>{item.value} · {item.score}</span>)}
          </div>
        ))}
      </div>
      <div className="personalRoute">
        <strong>Recommended route outside your fence</strong>
        {recommendedTracks.map((track) => (
          <span key={track.id}>{track.genre} · score {scoreCurriculumTrack(track, taste)}</span>
        ))}
      </div>
    </div>
  );
}
