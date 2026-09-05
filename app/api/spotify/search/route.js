import { hasSpotifyCredentials, searchSpotify } from '../../../../lib/spotify';

const MAX_QUERY_LENGTH = 100;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();

  if (!query) {
    return Response.json({ albums: [], tracks: [] });
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return Response.json(
      { error: `Search query must be ${MAX_QUERY_LENGTH} characters or fewer`, albums: [], tracks: [] },
      { status: 400 }
    );
  }

  if (!hasSpotifyCredentials()) {
    return Response.json(
      { error: 'Spotify API credentials are not configured', albums: [], tracks: [] },
      { status: 503 }
    );
  }

  try {
    const results = await searchSpotify(query);
    return Response.json(results, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Spotify search failed', error);
    return Response.json(
      { error: 'Spotify search is temporarily unavailable', albums: [], tracks: [] },
      { status: 502 }
    );
  }
}
