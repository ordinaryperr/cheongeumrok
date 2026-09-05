import { createClient } from '@supabase/supabase-js';
import { getSpotifyItem, hasSpotifyCredentials, isValidSpotifyId } from '../../../../lib/spotify';

const MAX_AUTHORIZATION_LENGTH = 8192;

function createServerClients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceRoleKey) return null;

  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  return {
    auth: createClient(url, anonKey, options),
    admin: createClient(url, serviceRoleKey, options),
  };
}

async function ensureAlbum(admin, album) {
  const { data, error } = await admin
    .from('albums')
    .upsert({
      spotify_id: album.id,
      title: album.title,
      artist: album.artist,
      cover_url: album.coverUrl,
      release_date: album.releaseDate || album.year || null,
      album_type: album.albumType || 'album',
      external_url: album.externalUrl,
    }, { onConflict: 'spotify_id' })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

async function ensureTrack(admin, track, albumId) {
  const { data, error } = await admin
    .from('tracks')
    .upsert({
      spotify_id: track.id,
      album_id: albumId,
      title: track.title,
      artist: track.artist,
      duration_ms: track.durationMs,
      external_url: track.externalUrl,
    }, { onConflict: 'spotify_id' })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function POST(request) {
  const authorization = request.headers.get('authorization') || '';
  if (authorization.length > MAX_AUTHORIZATION_LENGTH) {
    return Response.json({ error: 'Invalid authorization header' }, { status: 400 });
  }
  const accessToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }

  let input;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const spotifyId = input?.spotifyId;
  const type = input?.type;
  if (!isValidSpotifyId(spotifyId) || !['album', 'track'].includes(type)) {
    return Response.json({ error: 'Invalid Spotify resource' }, { status: 400 });
  }

  const clients = createServerClients();
  if (!clients || !hasSpotifyCredentials()) {
    return Response.json({ error: 'Catalog service is not configured' }, { status: 503 });
  }

  const { data: userData, error: userError } = await clients.auth.auth.getUser(accessToken);
  if (userError || !userData?.user) {
    return Response.json({ error: 'Invalid session' }, { status: 401 });
  }

  const { data: quotaAllowed, error: quotaError } = await clients.admin.rpc('consume_catalog_save_quota', {
    p_user_id: userData.user.id,
    p_limit: 30,
    p_window: '1 hour',
  });
  if (quotaError) {
    console.error('Catalog quota check failed', quotaError);
    return Response.json({ error: 'Catalog service is temporarily unavailable' }, { status: 503 });
  }
  if (quotaAllowed !== true) {
    return Response.json({ error: 'Catalog save limit exceeded' }, { status: 429 });
  }

  try {
    const item = await getSpotifyItem({ id: spotifyId, type });
    if (!item) {
      return Response.json({ error: 'Spotify resource not found' }, { status: 404 });
    }

    if (type === 'album') {
      const albumId = await ensureAlbum(clients.admin, item);
      return Response.json({ albumId, trackId: null });
    }

    if (!isValidSpotifyId(item.albumId)) {
      return Response.json({ error: 'Spotify parent album not found' }, { status: 502 });
    }

    const parentAlbum = await getSpotifyItem({ id: item.albumId, type: 'album' });
    if (!parentAlbum) {
      return Response.json({ error: 'Spotify parent album not found' }, { status: 502 });
    }

    const albumId = await ensureAlbum(clients.admin, parentAlbum);
    const trackId = await ensureTrack(clients.admin, item, albumId);
    return Response.json({ albumId, trackId });
  } catch (error) {
    console.error('Catalog ensure failed', error);
    return Response.json({ error: 'Catalog lookup failed' }, { status: 502 });
  }
}
