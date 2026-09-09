import { supabase } from './supabase';

export async function getPublicReviews({ limit } = {}) {
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
    throw new RangeError('Review limit must be a positive integer');
  }
  if (!supabase) return { data: null, error: new Error('Supabase is not configured') };

  const query = supabase
    .from('reviews')
    .select(`
      id,
      user_id,
      rating,
      one_liner,
      body,
      created_at,
      album_id,
      track_id,
      albums:album_id (id, title, artist, cover_url, release_date, album_type),
      tracks:track_id (id, title, artist, albums:album_id (cover_url))
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  return limit === undefined ? query : query.limit(limit);
}

export async function createAlbumReview({ userId, albumId, rating, oneLiner, body }) {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured') };

  return supabase
    .from('reviews')
    .insert({
      user_id: userId,
      album_id: albumId,
      rating,
      one_liner: oneLiner,
      body,
    })
    .select()
    .single();
}
