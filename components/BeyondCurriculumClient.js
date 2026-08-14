'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { curriculumTracks } from '../data/beyondYourFence';
import { calculateLevelProgress, extractTasteSignals, normalizeMusicTagRecord, personalizeCurriculumTracks } from '../lib/taste';
import { supabase } from '../lib/supabase';

function genreParam(value = '') {
  return String(value).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function buildBeyondHref(genre) {
  const param = genreParam(genre);
  return param ? `/beyond-your-fence?genre=${param}#${param}` : '/beyond-your-fence';
}

function buildEvidenceSources({ status, reviews }) {
  return [
    { label: 'Source', value: '청음록 편집 커리큘럼' },
    { label: 'Based on', value: status === 'ready' ? `내 공개/비공개 기록 ${reviews.length}개` : '기본 장르 경로' },
    { label: 'Signals', value: 'music_tags · 온톨로지 그래프 · 평점 가중치' },
  ];
}

function buildAssignmentReason({ track, level, taste, status }) {
  if (status !== 'ready' || !taste?.top) {
    return `청음록 편집 커리큘럼 기준으로 ${track.genre}의 ${level.name} 단계에 배치된 과제입니다. 기록이 쌓이면 개인 취향 신호에 맞춰 이유가 더 구체화됩니다.`;
  }

  const genres = (taste.top.genre || []).filter((item) => item.value !== 'Unknown').slice(0, 2).map((item) => item.value);
  const moods = (taste.top.mood || []).filter((item) => item.value !== 'unclassified').slice(0, 2).map((item) => item.value);
  const textures = (taste.top.texture || []).filter((item) => item.value !== 'unclassified').slice(0, 2).map((item) => item.value);
  const signals = [...moods, ...textures, ...genres].slice(0, 4);
  const from = genres[0] || taste.primaryGenre || 'your current taste';
  const signalText = signals.length ? signals.join(', ') : 'your recent listening pattern';

  return `당신의 기록에서 ${signalText} 신호가 강하게 나타났습니다. 이 과제는 ${from}에서 ${track.genre}로 넘어가는 브리지 역할을 하며, ${level.name} 단계에 맞춰 익숙함보다 한 걸음 더 낯선 음악을 듣게 합니다.`;
}

function buildProgressExplanation({ computed, level }) {
  if (!computed) {
    return '로그인 후 내 기록의 genre, difficulty, mood, texture 태그를 기준으로 진행도가 계산됩니다.';
  }

  return `${level.name} 통과 조건은 단순 기록 수만 보지 않습니다. 현재 증거는 장르 일치 ${computed.exactGenreCount}개, 난이도 충족 ${computed.matchingDifficultyCount}개, mood/texture 증거 ${computed.moodTextureCount}개, 인접 장르 ${computed.adjacentCount}개입니다.`;
}

function buildAlbumAssignmentReason({ album, track, level, taste, status }) {
  const [artist, title] = String(album).split(' — ').map((item) => item?.trim()).filter(Boolean);
  const levelFrame = {
    Freshman: '입문 기준점을 만들기 위한 앨범입니다.',
    Sophomore: '장르 안의 구조와 시대 차이를 비교하게 하는 앨범입니다.',
    Junior: '하위 장르와 영향 관계를 더 정확히 듣게 하는 앨범입니다.',
    Senior: '익숙한 취향을 흔드는 고난도 과제 앨범입니다.',
  }[level.name] || '커리큘럼 기준 앨범입니다.';

  if (status !== 'ready' || !taste?.top) {
    return `${artist ? `${artist}의 ` : ''}${title || album}은 ${track.genre} ${level.name} 단계에서 ${levelFrame}`;
  }

  const strongest = [
    ...(taste.top.mood || []),
    ...(taste.top.texture || []),
    ...(taste.top.genre || []),
  ].find((item) => !['Unknown', 'unclassified'].includes(item.value));
  const signal = strongest ? `${strongest.value} 신호` : '최근 기록의 취향 신호';
  return `${signal}에서 바로 비슷한 음악으로 가지 않고 ${track.genre}의 다른 문법으로 이동하도록 고른 앨범입니다. ${levelFrame}`;
}

export default function BeyondCurriculumClient() {
  const searchParams = useSearchParams();
  const selectedGenre = searchParams.get('genre') || 'all';
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState('loading');
  const [expandedTracks, setExpandedTracks] = useState(new Set());

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

  const genreOptions = useMemo(() => [{ label: 'All', param: 'all' }, ...tracks.map((track) => ({ label: track.genre, param: genreParam(track.genre) }))], [tracks]);
  const visibleTracks = useMemo(() => (
    selectedGenre === 'all'
      ? tracks
      : tracks.filter((track) => genreParam(track.genre) === selectedGenre)
  ), [selectedGenre, tracks]);

  return (
    <div className="curriculumList">
      <div className="beyondGenreTabs" aria-label="Beyond 장르 필터">
        {genreOptions.map((option) => (
          <Link className={selectedGenre === option.param ? 'active' : ''} href={option.param === 'all' ? '/beyond-your-fence' : `/beyond-your-fence?genre=${option.param}#${option.param}`} key={option.param}>{option.label}</Link>
        ))}
      </div>
      {status === 'guest' ? <p className="empty">로그인하면 기록 기반으로 커리큘럼 순서와 진행도가 개인화됩니다.</p> : null}
      {visibleTracks.length ? visibleTracks.map((track) => {
        let previousComplete = true;
        const trackKey = genreParam(track.genre);
        const forceExpanded = selectedGenre !== 'all';
        const expanded = forceExpanded || expandedTracks.has(trackKey);
        const levelsToShow = expanded ? track.levels : track.levels.slice(0, 1);

        return (
          <article className="curriculumTrack" id={trackKey} key={track.id}>
            <div className="trackIntro">
              <p className="eyebrow">{track.signal}</p>
              <h2>{track.genre}</h2>
              <p>{track.reason}</p>
              {selectedGenre === 'all' ? (
                <button
                  type="button"
                  className="routeToggleButton"
                  onClick={() => setExpandedTracks((prev) => {
                    const next = new Set(prev);
                    if (next.has(trackKey)) next.delete(trackKey);
                    else next.add(trackKey);
                    return next;
                  })}
                >
                  {expanded ? 'Collapse route' : 'Show full route'}
                </button>
              ) : null}
            </div>
            <div className="levelGrid">
              {levelsToShow.map((level, index) => {
                const computed = status === 'ready'
                  ? calculateLevelProgress({ track, level, reviews, previousComplete })
                  : null;
                const total = computed?.total || level.requirements.length;
                const completed = computed?.completed ?? (level.status === 'open' ? 1 : 0);
                const progress = computed?.progress ?? Math.round((completed / total) * 100);
                const unlocked = computed?.unlocked ?? level.status === 'open';
                const cardStatus = unlocked ? 'open' : 'locked';
                previousComplete = progress >= 100;

                const sources = buildEvidenceSources({ status, reviews });

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

                    <div className="progressExplanation">
                      <strong>How progress is judged</strong>
                      <p>{buildProgressExplanation({ computed, level })}</p>
                    </div>

                    <div className="assignmentReason">
                      <strong>Why this assignment?</strong>
                      <p>{buildAssignmentReason({ track, level, taste, status })}</p>
                      <div className="evidenceSources">
                        {sources.map((source) => (
                          <span key={source.label}><b>{source.label}</b>{source.value}</span>
                        ))}
                        {computed ? <span><b>Progress evidence</b>{computed.exactGenreCount} genre · {computed.matchingDifficultyCount} difficulty · {computed.moodTextureCount} mood/texture</span> : null}
                      </div>
                    </div>

                    <div className="courseAlbums">
                      {level.albums.map((album) => (
                        <a key={album} href={`/search?q=${encodeURIComponent(album)}`}>
                          <b>{album}</b>
                          <small>{buildAlbumAssignmentReason({ album, track, level, taste, status })}</small>
                          <em>Search / record this assignment →</em>
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
                      <a className="semesterButton" href={`/search?q=${encodeURIComponent(level.albums[0] || track.genre)}`}>Start {level.name} with first album</a>
                    ) : (
                      <div className="lockedHint">Complete {track.levels[index - 1]?.name || 'previous semester'} requirements to unlock.</div>
                    )}
                  </div>
                );
              })}
            </div>
          </article>
        );
      }) : <p className="empty">선택한 장르의 Beyond Route를 찾을 수 없습니다.</p>}
    </div>
  );
}
