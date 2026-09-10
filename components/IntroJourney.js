'use client';

import { useEffect, useRef } from 'react';

export default function IntroJourney({ children }) {
  const rootRef = useRef(null);
  useEffect(() => {
    const root = rootRef.current;
    const earth = root.querySelector('.earthIntro');
    const video = root.querySelector('.videoIntro');
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    function update() {
      frame = 0;
      const distance = root.offsetHeight - root.querySelector('.introJourneyFrame').offsetHeight;
      const progress = media.matches ? 0 : Math.max(0, Math.min(1, -root.getBoundingClientRect().top / Math.max(1, distance)));
      root.style.setProperty('--earth-zoom', String(1 + 16 * progress * progress));
      root.style.setProperty('--earth-fade', String(1 - Math.max(0, Math.min(1, (progress - 0.72) / 0.28))));
      root.style.setProperty('--earth-copy', String(Math.max(0, 1 - progress * 4)));
      // Once zooming, let touch gestures scroll instead of grabbing the enlarged globe.
      earth.querySelector('.earthStage').style.pointerEvents = progress > 0.05 ? 'none' : '';
      earth.inert = !media.matches && progress > 0.9;
      video.inert = !media.matches && progress < 0.9;
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    media.addEventListener('change', schedule);
    const resize = new ResizeObserver(schedule);
    resize.observe(root);
    update();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      media.removeEventListener('change', schedule);
      earth.inert = false; video.inert = false;
    };
  }, []);
  return (
    <div className="introJourney" ref={rootRef}>
      <div id="video-intro" className="introJourneyDestination" aria-hidden="true" />
      <div className="introJourneyFrame">{children}</div>
    </div>
  );
}
