'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { logEvent } from '../lib/events';

export default function VisitTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    logEvent('page_view', {
      title: document.title,
      search: searchParams.toString(),
    });
  }, [pathname, searchParams]);

  return null;
}
