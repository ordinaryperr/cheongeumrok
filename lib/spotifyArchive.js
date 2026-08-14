import { searchSpotify } from './spotify';

export const archiveCollections = [
  {
    id: 'jazz-entry-points',
    title: '처음 만나는 재즈/소울',
    subtitle: '익숙한 팝 보컬에서 한 걸음 옆으로',
    description: '밤에 듣기 좋은 보컬, 느린 그루브, 악기 사이의 여백을 중심으로 고른 실제 앨범 아카이브입니다.',
    tags: ['Jazz', 'Soul', '입문'],
    queries: ['Miles Davis Kind of Blue', 'Chet Baker Sings', 'Bill Evans Waltz for Debby'],
  },
  {
    id: 'ambient-room',
    title: '방의 크기를 바꾸는 앰비언트',
    subtitle: '멜로디보다 공간을 듣는 연습',
    description: '가사와 후렴 없이도 감상이 깊어지는 음반들. 조용히 집중하고 싶은 날의 확장 추천입니다.',
    tags: ['Ambient', '공간', '집중'],
    queries: ['Brian Eno Music for Airports', 'Hiroshi Yoshimura Green', 'Aphex Twin Selected Ambient Works 85-92'],
  },
  {
    id: 'post-punk-starters',
    title: '긴장감으로 여는 포스트펑크',
    subtitle: '깔끔하지 않아서 더 오래 남는 리듬',
    description: '차가운 보컬, 반복되는 베이스라인, 불편한 질감을 통해 록/팝 바깥으로 나아가는 실제 앨범들입니다.',
    tags: ['Post-Punk', 'Rhythm', 'Tension'],
    queries: ['Joy Division Unknown Pleasures', 'Talking Heads Remain in Light', 'The Cure Seventeen Seconds'],
  },
];

export const starterAlbumQueries = [
  'Miles Davis Kind of Blue',
  'Brian Eno Music for Airports',
  'Joy Division Unknown Pleasures',
  'Erykah Badu Mama’s Gun',
  'Aphex Twin Selected Ambient Works 85-92',
  'The Velvet Underground & Nico',
];

function mapSpotifyAlbumForCard(album, tags = ['Spotify', '실제 앨범']) {
  return {
    id: album.id,
    title: album.title,
    artist: album.artist,
    year: album.year || album.releaseDate?.slice(0, 4) || '연도 미상',
    genre: 'Spotify Album',
    rating: 0,
    reviews: 0,
    mood: tags,
    coverUrl: album.coverUrl,
    description: `${album.artist}의 ${album.title}`,
    href: `/albums/spotify/${album.id}`,
    externalUrl: album.externalUrl,
  };
}

async function findAlbum(query) {
  const results = await searchSpotify(query);
  return results.albums?.[0] || null;
}

export async function getSpotifyArchiveCollections() {
  try {
    const collections = await Promise.all(archiveCollections.map(async (collection) => {
      const albums = (await Promise.all(collection.queries.map(findAlbum)))
        .filter(Boolean)
        .map((album) => mapSpotifyAlbumForCard(album, collection.tags.slice(0, 2)));
      return { ...collection, albums };
    }));

    return collections.filter((collection) => collection.albums.length > 0);
  } catch (error) {
    console.warn('Spotify archive를 불러오지 못했습니다:', error.message);
    return [];
  }
}

export async function getSpotifyStarterAlbums() {
  try {
    const albums = (await Promise.all(starterAlbumQueries.map(findAlbum))).filter(Boolean);
    return albums.map((album) => mapSpotifyAlbumForCard(album));
  } catch (error) {
    console.warn('Spotify starter albums를 불러오지 못했습니다:', error.message);
    return [];
  }
}
