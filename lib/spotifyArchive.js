import { getCuratedAlbumId } from '../data/curatedAlbumIds';
import { getSpotifyItem, searchSpotify } from './spotify';

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
  {
    id: 'hip-hop-canon',
    title: '힙합의 문장과 비트',
    subtitle: '랩, 샘플링, 프로덕션을 함께 듣기',
    description: '가사만이 아니라 드럼, 샘플, 앨범의 서사를 함께 듣게 하는 힙합 입문 아카이브입니다.',
    tags: ['Hip-Hop', 'Rap', 'Sampling'],
    queries: ['A Tribe Called Quest The Low End Theory', 'Nas Illmatic', 'Kendrick Lamar To Pimp a Butterfly'],
  },
  {
    id: 'dubstep-bass-pressure',
    title: '저역으로 들어가는 덥스텝',
    subtitle: '클럽의 큰 소리보다 공간과 압력 듣기',
    description: '베이스의 무게, 드럼의 빈틈, 어두운 공간감을 중심으로 덥스텝과 베이스 뮤직의 기준점을 모았습니다.',
    tags: ['Dubstep', 'Bass', 'UK'],
    queries: ['Burial Untrue', 'Skream Skream!', 'Kode9 Memories of the Future'],
  },
  {
    id: 'rnb-neo-soul',
    title: '느린 그루브의 R&B/네오소울',
    subtitle: '목소리와 리듬 사이의 온도',
    description: '따뜻한 보컬, 느슨한 드럼, 섬세한 화성을 통해 R&B와 네오소울의 깊이를 듣는 컬렉션입니다.',
    tags: ['R&B', 'Neo-Soul', 'Groove'],
    queries: ['D’Angelo Voodoo', 'Erykah Badu Mama’s Gun', 'SZA Ctrl'],
  },
  {
    id: 'electronic-techno',
    title: '전자음악의 몸과 기계',
    subtitle: '반복, 질감, 플로어의 에너지',
    description: '테크노와 전자음악을 멜로디가 아니라 반복의 움직임과 소리의 질감으로 듣게 하는 앨범들입니다.',
    tags: ['Electronic', 'Techno', 'Texture'],
    queries: ['Daft Punk Homework', 'The Chemical Brothers Dig Your Own Hole', 'Underworld Dubnobasswithmyheadman'],
  },
  {
    id: 'shoegaze-dream-pop',
    title: '기타가 안개가 되는 슈게이즈',
    subtitle: '노이즈 속의 멜로디 찾기',
    description: '두꺼운 기타 벽과 몽환적인 보컬 사이에서 멜로디를 찾는 슈게이즈/드림팝 입문 아카이브입니다.',
    tags: ['Shoegaze', 'Dream-Pop', 'Noise'],
    queries: ['My Bloody Valentine Loveless', 'Slowdive Souvlaki', 'Cocteau Twins Heaven or Las Vegas'],
  },
  {
    id: 'metal-heavy-entry',
    title: '무거운 음악의 첫 관문',
    subtitle: '소음이 아니라 구조와 리프 듣기',
    description: '강한 기타와 드럼을 단순한 세기보다 리프, 리듬, 긴장감의 구조로 듣게 하는 메탈 입문 컬렉션입니다.',
    tags: ['Metal', 'Heavy', 'Riff'],
    queries: ['Black Sabbath Paranoid', 'Metallica Master of Puppets', 'Deftones White Pony'],
  },
  {
    id: 'experimental-form-break',
    title: '형식을 흔드는 익스페리멘탈',
    subtitle: '노래의 규칙이 무너지는 순간 듣기',
    description: '익숙한 구조 바깥에서 소리, 개념, 질감이 음악이 되는 방식을 따라가는 실험음악 입문 컬렉션입니다.',
    tags: ['Experimental', 'Noise', 'Concept'],
    queries: ['Björk Vespertine', 'Radiohead Kid A', 'Can Tago Mago'],
  },
  {
    id: 'classical-contemporary-entry',
    title: '긴 호흡의 클래식/현대음악',
    subtitle: '선율, 침묵, 작곡의 구조 따라가기',
    description: '악장과 편성, 반복과 침묵을 통해 팝적 훅과 다른 방식으로 오래 듣는 훈련을 시작합니다.',
    tags: ['Classical', 'Contemporary Classical', 'Long Form'],
    queries: ['Max Richter The Blue Notebooks', 'Steve Reich Music for 18 Musicians', 'Arvo Pärt Tabula Rasa'],
  },
];

export const starterAlbumQueries = [
  'Miles Davis Kind of Blue',
  'Brian Eno Music for Airports',
  'Joy Division Unknown Pleasures',
  'Erykah Badu Mama’s Gun',
  'Aphex Twin Selected Ambient Works 85-92',
  'The Velvet Underground & Nico',
  'Burial Untrue',
  'Nas Illmatic',
  'My Bloody Valentine Loveless',
  'Max Richter The Blue Notebooks',
  'Björk Vespertine',
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
  const curatedId = getCuratedAlbumId(query);
  if (curatedId) {
    try {
      return await getSpotifyItem({ id: curatedId, type: 'album' });
    } catch (error) {
      console.warn(`canonical Spotify 앨범 조회 실패 (${query}):`, error.message);
    }
  }

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
