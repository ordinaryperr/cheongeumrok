import { supabase } from './supabase';

const ANON_KEY = 'cheongeumrok-anonymous-id';

export function getAnonymousId() {
  if (typeof window === 'undefined') return null;
  try {
    let id = window.localStorage.getItem(ANON_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export async function logEvent(eventType, metadata = {}) {
  if (!supabase || typeof window === 'undefined') return;

  try {
    const { data } = await supabase.auth.getUser();
    const user = data?.user || null;
    await supabase.from('visit_events').insert({
      event_type: eventType,
      user_id: user?.id || null,
      anonymous_id: getAnonymousId(),
      path: window.location.pathname + window.location.search,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent?.slice(0, 240) || null,
      metadata,
    });
  } catch {
    // Analytics should never block product usage.
  }
}
