'use client';

import { useRef, useState } from 'react';

const VIDEO_ID = 'n1h1AOeVQ38';
const VIDEO_SRC = `https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&mute=1&controls=0&loop=1&playlist=${VIDEO_ID}&playsinline=1&modestbranding=1&rel=0&enablejsapi=1`;

export default function IntroVideo() {
  const iframeRef = useRef(null);
  const [soundOn, setSoundOn] = useState(false);

  function sendYoutubeCommand(func, args = []) {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args }),
      'https://www.youtube.com'
    );
  }

  function handleSoundToggle() {
    if (soundOn) {
      sendYoutubeCommand('mute');
      setSoundOn(false);
      return;
    }

    sendYoutubeCommand('unMute');
    sendYoutubeCommand('setVolume', [70]);
    sendYoutubeCommand('playVideo');
    setSoundOn(true);
  }

  return (
    <section className="introLanding videoIntro" aria-label="청음록 인트로">
      <iframe
        ref={iframeRef}
        className="introVideo"
        src={VIDEO_SRC}
        title="청음록 인트로 영상"
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <div className="introVideoOverlay" aria-hidden="true" />
      <button type="button" className="soundToggle" onClick={handleSoundToggle}>
        {soundOn ? '사운드 끄기' : '사운드 켜기'}
      </button>
      <div className="scrollCue">scroll</div>
    </section>
  );
}
