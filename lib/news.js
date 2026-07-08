import { supabase } from './supabase';

export async function getNewsPosts({ limit } = {}) {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured') };

  let query = supabase
    .from('news_posts')
    .select('id, title, summary, source, source_url, category, published_at')
    .order('published_at', { ascending: false });

  if (limit) query = query.limit(limit);

  return query;
}

export function formatNewsDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export function mapSupabaseNewsPost(post) {
  return {
    id: post.id,
    category: post.category || 'News',
    title: post.title,
    summary: post.summary || '',
    source: post.source || '청음록 편집부',
    sourceUrl: post.source_url || null,
    date: formatNewsDate(post.published_at),
  };
}
