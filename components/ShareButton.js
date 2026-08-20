'use client';

import { useState } from 'react';
import { logEvent } from '../lib/events';

export default function ShareButton({ label = '공유', text = '청음록에서 보기', path }) {
  const [message, setMessage] = useState('');

  async function handleShare() {
    const url = path ? new URL(path, window.location.origin).toString() : window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        setMessage('링크가 복사되었습니다.');
      }
      logEvent('share_clicked', { url, label });
    } catch (error) {
      if (error?.name !== 'AbortError') setMessage('공유하지 못했습니다.');
    }
  }

  return (
    <span className="shareInline">
      <button type="button" className="secondary" onClick={handleShare}>{label}</button>
      {message ? <small>{message}</small> : null}
    </span>
  );
}
