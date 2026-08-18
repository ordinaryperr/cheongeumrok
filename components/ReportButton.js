'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ReportButton({ targetType, targetId }) {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  async function handleReport() {
    if (!supabase || !targetType || !targetId) return;
    const reason = window.prompt('신고 사유를 간단히 적어주세요.');
    if (!reason?.trim()) return;

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      setMessage('신고하려면 로그인해야 합니다.');
      return;
    }

    setStatus('saving');
    const { error } = await supabase.from('reports').insert({
      target_type: targetType,
      target_id: targetId,
      reporter_id: user.id,
      reason: reason.trim(),
    });

    if (error) setMessage(error.message);
    else setMessage('신고가 접수되었습니다.');
    setStatus('idle');
  }

  return (
    <span className="reportInline">
      <button type="button" onClick={handleReport} disabled={status === 'saving'}>{status === 'saving' ? '신고 중' : '신고'}</button>
      {message ? <small>{message}</small> : null}
    </span>
  );
}
