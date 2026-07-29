const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const API_BASE = 'https://api.spotify.com/v1';

let cachedToken = null;
let tokenExpiresAt = 0;

export function hasSpotifyCredentials() {
  return Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
}

async function getSpotifyAccessToken() {
  if (!hasSpotifyCredentials()) {
    throw new Error('Spotify API credentials are not configured');
  }

  if (cachedToken && Date.now() < tokenExpiresAt - 30_000) {
    return cachedToken;
  }

  const credentials = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Spotify token request failed: ${response.status}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;
  return cachedToken;
}

function mapAlbum(item) {
  const image = item.images?.[0]?.url || null;
  return {
    id: item.id,
    type: 'album',
    title: item.name,
    artist: item.artists?.map((artist) => artist.name).join(', ') || 'Unknown Artist',
    year: item.release_date?.slice(0, 4) || '',
    releaseDate: item.release_date || '',
    totalTracks: item.total_tracks || null,
    coverUrl: image,
    externalUrl: item.external_urls?.spotify || null,
  };
}

function mapTrack(item) {
  const image = item.album?.images?.[0]?.url || null;
  return {
    id: item.id,
    type: 'track',
    title: item.name,
    artist: item.artists?.map((artist) => artist.name).join(', ') || 'Unknown Artist',
    album: item.album?.name || '',
    year: item.album?.release_date?.slice(0, 4) || '',
    releaseDate: item.album?.release_date || '',
    durationMs: item.duration_ms || null,
    coverUrl: image,
    externalUrl: item.external_urls?.spotify || null,
  };
}

async function fetchSpotifyResource(path) {
  const token = await getSpotifyAccessToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Spotify request failed: ${response.status}`);
  }

  return response.json();
}

export async function getSpotifyItem({ id, type }) {
  if (!id || !['album', 'track'].includes(type)) return null;

  const item = await fetchSpotifyResource(`/${type}s/${id}?market=KR`);
  return type === 'album' ? mapAlbum(item) : mapTrack(item);
}

export async function searchSpotify(query) {
  const token = await getSpotifyAccessToken();
  const params = new URLSearchParams({
    q: query,
    type: 'album,track',
    market: 'KR',
    limit: '8',
  });

  const response = await fetch(`${API_BASE}/search?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Spotify search failed: ${response.status}`);
  }

  const data = await response.json();
  return {
    albums: data.albums?.items?.map(mapAlbum) || [],
    tracks: data.tracks?.items?.map(mapTrack) || [],
  };
}
