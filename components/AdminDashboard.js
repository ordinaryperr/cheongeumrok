'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function shortId(value = '') {
  return String(value || '').slice(0, 8) || 'anonymous';
}

function targetHref(report) {
  if (!report) return null;
  if (report.target_type === 'review') return `/reviews/${report.target_id}`;
  if (report.target_type === 'profile') return `/users/${report.target_id}`;
  return null;
}

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [albumsById, setAlbumsById] = useState(new Map());
  const [reports, setReports] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventsAvailable, setEventsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const isAdmin = Boolean(profile?.is_admin);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setMessage('');

      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData?.user || null;
      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, display_name, is_admin, created_at')
        .eq('id', currentUser.id)
        .single();

      if (profileError) {
        setMessage(profileError.message);
        setLoading(false);
        return;
      }

      setProfile(currentProfile);

      if (!currentProfile?.is_admin) {
        setLoading(false);
        return;
      }

      await loadAdminData();
      setLoading(false);
    }

    load();
  }, []);

  async function loadAdminData() {
    setMessage('');
    const [profileResult, reviewResult, reportResult, eventResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, username, display_name, is_admin, created_at')
        .order('created_at', { ascending: false })
        .limit(12),
      supabase
        .from('reviews')
        .select('id, user_id, album_id, track_id, rating, body, is_public, created_at')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('reports')
        .select('id, target_type, target_id, reporter_id, reason, status, created_at')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('visit_events')
        .select('id, event_type, user_id, anonymous_id, path, referrer, metadata, created_at')
        .order('created_at', { ascending: false })
        .limit(30),
    ]);

    if (profileResult.error || reviewResult.error || reportResult.error) {
      setMessage(profileResult.error?.message || reviewResult.error?.message || reportResult.error?.message || '관리 데이터를 불러오지 못했습니다.');
    }
    if (eventResult.error) {
      setEventsAvailable(false);
    } else {
      setEventsAvailable(true);
    }

    const nextProfiles = profileResult.data || [];
    const nextReviews = reviewResult.data || [];
    const nextReports = reportResult.data || [];
    const nextEvents = eventResult.data || [];
    setProfiles(nextProfiles);
    setReviews(nextReviews);
    setReports(nextReports);
    setEvents(nextEvents);

    const albumIds = Array.from(new Set(nextReviews.map((review) => review.album_id).filter(Boolean)));
    if (albumIds.length) {
      const { data: albumData } = await supabase
        .from('albums')
        .select('id, title, artist, spotify_id, cover_url')
        .in('id', albumIds);
      setAlbumsById(new Map((albumData || []).map((album) => [album.id, album])));
    }
  }

  const profilesById = useMemo(() => new Map(profiles.map((item) => [item.id, item])), [profiles]);

  async function updateReportStatus(reportId, status) {
    setMessage('');
    const { error } = await supabase.from('reports').update({ status }).eq('id', reportId);
    if (error) {
      setMessage(error.message);
      return;
    }
    setReports((items) => items.map((item) => (item.id === reportId ? { ...item, status } : item)));
  }

  async function setReviewVisibility(reviewId, isPublic) {
    setMessage('');
    const { error } = await supabase.from('reviews').update({ is_public: isPublic }).eq('id', reviewId);
    if (error) {
      setMessage(error.message);
      return;
    }
    setReviews((items) => items.map((item) => (item.id === reviewId ? { ...item, is_public: isPublic } : item)));
  }

  async function deleteReview(reviewId) {
    const ok = window.confirm('이 리뷰를 삭제할까요? 되돌릴 수 없습니다.');
    if (!ok) return;
    setMessage('');
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
    if (error) {
      setMessage(error.message);
      return;
    }
    setReviews((items) => items.filter((item) => item.id !== reviewId));
  }

  const todayEvents = events.filter((event) => Date.now() - new Date(event.created_at).getTime() < 24 * 60 * 60 * 1000).length;
  const signupEvents = events.filter((event) => event.event_type === 'signup').length;
  const reviewEvents = events.filter((event) => event.event_type === 'review_created').length;
  const topPaths = Array.from(events.reduce((map, event) => {
    if (!event.path) return map;
    map.set(event.path, (map.get(event.path) || 0) + 1);
    return map;
  }, new Map()).entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topReferrers = Array.from(events.reduce((map, event) => {
    const referrer = event.referrer || 'direct';
    map.set(referrer, (map.get(referrer) || 0) + 1);
    return map;
  }, new Map()).entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (loading) {
    return <p className="empty">관리자 권한을 확인하는 중입니다.</p>;
  }

  if (!user) {
    return (
      <div className="emptyState">
        <p className="eyebrow">admin only</p>
        <h2>로그인이 필요합니다.</h2>
        <div className="heroActions"><Link className="primary" href="/login">Login</Link></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="emptyState">
        <p className="eyebrow">admin only</p>
        <h2>관리자 권한이 없습니다.</h2>
        <p>현재 계정: {user.email}</p>
      </div>
    );
  }

  return (
    <div className="adminDashboard">
      {message ? <p className="formMessage error">{message}</p> : null}

      <div className="adminStats">
        <div><b>{profiles.length}</b><span>최근 가입자</span></div>
        <div><b>{reviews.length}</b><span>최근 리뷰</span></div>
        <div><b>{reports.filter((item) => item.status === 'open').length}</b><span>미처리 신고</span></div>
      </div>
      <div className="adminActions adminTopActions">
        <button type="button" onClick={loadAdminData}>새로고침</button>
        <Link href="/admin/news">뉴스 관리</Link>
      </div>

      <section className="adminPanel">
        <div className="sectionTitle compactTitle">
          <div><p className="eyebrow">events</p><h2>최근 행동 로그</h2></div>
        </div>
        <div className="adminList">
          {!eventsAvailable ? <p className="empty">visit_events SQL을 실행하면 방문/행동 로그가 표시됩니다.</p> : null}
          {eventsAvailable ? (
            <div className="adminInsightGrid">
              <div><b>{todayEvents}</b><span>최근 24시간 이벤트</span></div>
              <div><b>{signupEvents}</b><span>최근 가입 이벤트</span></div>
              <div><b>{reviewEvents}</b><span>최근 리뷰 작성 이벤트</span></div>
            </div>
          ) : null}
          {eventsAvailable && topPaths.length ? (
            <div className="adminMiniList"><b>인기 경로</b>{topPaths.map(([path, count]) => <span key={path}>{path} · {count}</span>)}</div>
          ) : null}
          {eventsAvailable && topReferrers.length ? (
            <div className="adminMiniList"><b>유입 경로</b>{topReferrers.map(([referrer, count]) => <span key={referrer}>{referrer} · {count}</span>)}</div>
          ) : null}
          {eventsAvailable && events.length ? events.map((event) => {
            const actor = event.user_id ? profilesById.get(event.user_id) : null;
            return (
              <article className="adminRow compactRow" key={event.id}>
                <div>
                  <p className="adminMeta">{formatDate(event.created_at)} · {event.event_type}</p>
                  <b>{event.path || 'unknown path'}</b>
                  <small>{actor?.display_name || actor?.username || shortId(event.user_id || event.anonymous_id)}{event.referrer ? ` · from ${event.referrer}` : ''}</small>
                </div>
              </article>
            );
          }) : eventsAvailable ? <p className="empty">아직 이벤트가 없습니다.</p> : null}
        </div>
      </section>

      <section className="adminPanel">
        <div className="sectionTitle compactTitle">
          <div><p className="eyebrow">reports</p><h2>최근 신고</h2></div>
        </div>
        <div className="adminList">
          {reports.length ? reports.map((report) => {
            const reporter = profilesById.get(report.reporter_id);
            const href = targetHref(report);
            return (
              <article className="adminRow" key={report.id}>
                <div>
                  <p className="adminMeta">{formatDate(report.created_at)} · {report.target_type} · {shortId(report.target_id)}</p>
                  <b>{report.reason}</b>
                  <small>신고자: {reporter?.display_name || reporter?.username || shortId(report.reporter_id)}</small>
                  {href ? <p><Link href={href}>신고 대상 열기 →</Link></p> : null}
                </div>
                <div className="adminActions">
                  <span className={`statusPill ${report.status}`}>{report.status}</span>
                  {['open', 'reviewed', 'resolved', 'dismissed'].map((status) => (
                    <button type="button" key={status} onClick={() => updateReportStatus(report.id, status)} disabled={report.status === status}>{status}</button>
                  ))}
                </div>
              </article>
            );
          }) : <p className="empty">신고가 없습니다.</p>}
        </div>
      </section>

      <section className="adminPanel">
        <div className="sectionTitle compactTitle">
          <div><p className="eyebrow">reviews</p><h2>최근 리뷰</h2></div>
        </div>
        <div className="adminList">
          {reviews.length ? reviews.map((review) => {
            const author = profilesById.get(review.user_id);
            const album = albumsById.get(review.album_id);
            return (
              <article className="adminRow" key={review.id}>
                <div>
                  <p className="adminMeta">{formatDate(review.created_at)} · ★ {review.rating} · {review.is_public ? 'public' : 'private'}</p>
                  <b>{album ? `${album.artist} — ${album.title}` : `album ${shortId(review.album_id)}`}</b>
                  <p>{review.body?.slice(0, 180)}</p>
                  <small>작성자: {author?.display_name || author?.username || shortId(review.user_id)}</small>
                </div>
                <div className="adminActions">
                  <Link href={`/reviews/${review.id}`}>열기</Link>
                  {review.is_public ? <button type="button" onClick={() => setReviewVisibility(review.id, false)}>숨김</button> : <button type="button" onClick={() => setReviewVisibility(review.id, true)}>복구</button>}
                  <button type="button" className="dangerButton" onClick={() => deleteReview(review.id)}>삭제</button>
                </div>
              </article>
            );
          }) : <p className="empty">리뷰가 없습니다.</p>}
        </div>
      </section>

      <section className="adminPanel">
        <div className="sectionTitle compactTitle">
          <div><p className="eyebrow">users</p><h2>최근 가입자</h2></div>
        </div>
        <div className="adminUserGrid">
          {profiles.map((item) => (
            <Link href={`/users/${item.id}`} className="adminUserCard" key={item.id}>
              <b>{item.display_name || item.username || shortId(item.id)}</b>
              <small>{formatDate(item.created_at)}</small>
              {item.is_admin ? <span>admin</span> : null}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
