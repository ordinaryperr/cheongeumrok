'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createEarthRenderer } from '../lib/earthRenderer';

const motionQuery = '(prefers-reduced-motion: reduce)';
function subscribeMotion(callback) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}
const readMotion = () => window.matchMedia(motionQuery).matches;
const serverMotion = () => true;

export default function EarthIntro() {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const reducedMotion = useSyncExternalStore(subscribeMotion, readMotion, serverMotion);
  const [userPaused, setUserPaused] = useState(null);
  const [status, setStatus] = useState('loading');
  const paused = userPaused ?? reducedMotion;

  useEffect(() => {
    let disposed = false;
    const renderer = createEarthRenderer(canvasRef.current, {
      onReady: () => { if (!disposed) setStatus('ready'); },
      onError: () => { queueMicrotask(() => { if (!disposed) setStatus('fallback'); }); },
    });
    rendererRef.current = renderer;
    return () => { disposed = true; renderer?.dispose(); rendererRef.current = null; };
  }, []);

  useEffect(() => { rendererRef.current?.setPaused(paused); }, [paused]);

  return (
    <section className="introLanding earthIntro" aria-label="회전하는 3D 지구본 인트로">
      <div className="earthStars" aria-hidden="true" />
      <div className="earthMasthead"><span>청음록</span><span>LISTEN BEYOND YOUR WORLD</span></div>
      <div className="earthStage">
        <div className={`earthFallback ${status === 'ready' ? 'isHidden' : ''}`} aria-hidden="true" />
        <canvas ref={canvasRef} className={`earthCanvas ${status === 'ready' ? 'isReady' : ''}`} tabIndex={status === 'ready' ? 0 : -1} role="img" aria-label="드래그하거나 방향키로 회전하는 3D 지구본" aria-describedby="earth-drag-hint" />
      </div>
      <div className="earthCaption"><p>하나의 행성, 끝없는 음악.</p><span>익숙한 음악 너머, 새로운 세계로.</span><small id="earth-drag-hint">드래그로 회전 · 아래로 스크롤해 지구 속으로</small></div>
      <div className="earthFooter">
        <a className="earthEnter" href="#video-intro">인트로 영상 보기 <span aria-hidden="true">↓</span></a>
        <button className="earthPause" type="button" disabled={status !== 'ready'} onClick={() => setUserPaused(!paused)} aria-pressed={paused}>
          {status === 'fallback' ? '정지 이미지' : paused ? '회전 재생' : '회전 일시정지'}
        </button>
      </div>
      <a className="earthCredit" href="https://www.solarsystemscope.com/textures/" target="_blank" rel="noopener noreferrer">Earth textures: Solar System Scope · CC BY 4.0</a>
    </section>
  );
}
