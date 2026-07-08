import { supabase } from './supabase';

export function formatCommentTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function mapAlbumComment(comment) {
  return {
    id: comment.id,
    albumId: comment.album_id,
    userId: comment.user_id,
    user: 'listener',
    body: comment.body,
    createdAt: formatCommentTime(comment.created_at),
  };
}

export async function getAlbumComments(albumId) {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured') };

  return supabase
    .from('album_comments')
    .select('id, album_id, user_id, body, created_at')
    .eq('album_id', albumId)
    .order('created_at', { ascending: false });
}
