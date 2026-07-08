import { hasSpotifyCredentials, searchSpotify } from '../../../../lib/spotify';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();

  if (!query) {
    return Response.json({ albums: [], tracks: [] });
  }

  if (!hasSpotifyCredentials()) {
    return Response.json(
      { error: 'Spotify API credentials are not configured', albums: [], tracks: [] },
      { status: 503 }
    );
  }

  try {
    const results = await searchSpotify(query);
    return Response.json(results);
  } catch (error) {
    return Response.json(
      { error: error.message || 'Spotify search failed', albums: [], tracks: [] },
      { status: 500 }
    );
  }
}
