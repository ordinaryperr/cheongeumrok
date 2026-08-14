import { supabase } from './supabase';

const externalFeeds = [
  { source: 'Pitchfork', url: 'https://pitchfork.com/rss/news/', limit: 5 },
  { source: 'Spotify For the Record', url: 'https://newsroom.spotify.com/feed/', limit: 4 },
  { source: 'Rolling Stone', url: 'https://www.rollingstone.com/music/music-news/feed/', limit: 4 },
];

function decodeXml(value = '') {
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function readTag(item, tag) {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return decodeXml(match?.[1] || '');
}

function slugify(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function inferCategory(title = '', source = '') {
  const text = title.toLowerCase();
  if (source.includes('Spotify')) return 'Platform';
  if (text.includes('album') || text.includes('ep') || text.includes('single') || text.includes('song')) return 'New Music';
  if (text.includes('reissue') || text.includes('deluxe') || text.includes('vinyl')) return 'Reissue';
  if (text.includes('video') || text.includes('watch')) return 'Video';
  return 'News';
}

function looksLikeTranslatedDuplicate(title = '') {
  const ascii = title.replace(/[^\x00-\x7F]/g, '').length;
  return title.length > 0 && ascii / title.length < 0.72;
}

function mapExternalItem(item, source) {
  const title = readTag(item, 'title');
  const sourceUrl = readTag(item, 'link');
  const summary = readTag(item, 'description');
  const publishedAt = readTag(item, 'pubDate');
  if (!title || !sourceUrl) return null;
  return {
    id: `${slugify(source)}-${slugify(title)}`,
    category: inferCategory(title, source),
    title,
    summary,
    source,
    sourceUrl,
    date: formatNewsDate(publishedAt),
    publishedAt,
  };
}

export async function getExternalNewsPosts() {
  const results = await Promise.allSettled(externalFeeds.map(async (feed) => {
    const response = await fetch(feed.url, { next: { revalidate: 1800 } });
    if (!response.ok) throw new Error(`${feed.source} feed failed: ${response.status}`);
    const xml = await response.text();
    const items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
    return items
      .map((item) => mapExternalItem(item, feed.source))
      .filter(Boolean)
      .filter((item) => feed.source !== 'Spotify For the Record' || !looksLikeTranslatedDuplicate(item.title))
      .slice(0, feed.limit);
  }));

  return results.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
}

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

export function isPlaceholderNewsPost(post) {
  const title = post?.title || '';
  const source = post?.source || '';
  return ['이번 주 새로 나온 앨범들', '다시 커지는 바이닐 시장'].includes(title)
    || ['Music Desk'].includes(source);
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
