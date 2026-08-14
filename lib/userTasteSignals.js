import { extractTasteSignals } from './taste';
import { supabase } from './supabase';

export function tasteSignalsToRows(userId, taste) {
  if (!userId || !taste?.top) return [];

  return Object.entries(taste.top).flatMap(([dimension, items]) => (
    (items || [])
      .filter((item) => item.value && !['Unknown', 'unclassified'].includes(item.value))
      .slice(0, 5)
      .map((item) => ({
        user_id: userId,
        dimension,
        value: item.value,
        score: item.score || 0,
        updated_at: new Date().toISOString(),
      }))
  ));
}

export async function syncUserTasteSignals(userId, reviews) {
  if (!supabase || !userId) return { data: null, error: new Error('Supabase is not configured') };

  const taste = extractTasteSignals(reviews || []);
  const rows = tasteSignalsToRows(userId, taste);
  if (!rows.length) return { data: [], error: null, taste };

  const { data, error } = await supabase
    .from('user_taste_signals')
    .upsert(rows, { onConflict: 'user_id,dimension,value' })
    .select('dimension, value, score, updated_at');

  return { data, error, taste };
}
