'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminNewsLink() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAdmin() {
      if (!supabase) return;
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      if (mounted) setVisible(Boolean(profile?.is_admin));
    }

    checkAdmin();

    return () => {
      mounted = false;
    };
  }, []);

  if (!visible) return null;
  return <a className="secondary" href="/admin/news">뉴스 등록하기</a>;
}
