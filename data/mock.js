export const albums = [
  {
    id: 'mock-album',
    title: 'The Velvet Room',
    artist: 'Nara Kim',
    year: '2026',
    genre: 'Jazz / Soul',
    rating: 4.5,
    reviews: 128,
    mood: ['밤', '따뜻함', '잔향'],
    description: '도시의 불빛이 천천히 꺼질 때 남는 잔향 같은 앨범. 조용하지만 감정의 온도가 선명하다.',
  },
  {
    id: 'blue-static',
    title: 'Blue Static',
    artist: 'Room 404',
    year: '2025',
    genre: 'Indie Rock',
    rating: 4.0,
    reviews: 74,
    mood: ['청춘', '노이즈', '불안'],
    description: '거칠지만 이상하게 다정하다. 불안한 계절에 잘 어울리는 기타 사운드.',
  },
  {
    id: 'orbit-notes',
    title: 'Orbit Notes',
    artist: 'Jin Park',
    year: '2024',
    genre: 'Ambient',
    rating: 5.0,
    reviews: 212,
    mood: ['우주', '공간', '명상'],
    description: '소리가 공간을 만들고, 그 공간 안에서 오래 머물게 한다.',
  },
];

export const goodMusicArchive = [
  {
    id: 'entry-jazz-soul',
    title: '처음 만나는 재즈/소울',
    subtitle: '익숙한 팝 보컬에서 한 걸음 옆으로',
    description: '밤에 듣기 좋은 보컬, 느린 그루브, 악기 사이의 여백을 중심으로 고른 입문 아카이브입니다.',
    tags: ['입문', '보컬', '밤'],
    albums: [albums[0]],
  },
  {
    id: 'noise-and-youth',
    title: '불안한 계절의 기타 음악',
    subtitle: '깔끔하지 않아서 더 오래 남는 소리',
    description: '인디 록, 노이즈 팝, 얼터너티브 사운드 중 감정의 결이 선명한 앨범을 모읍니다.',
    tags: ['인디록', '노이즈', '청춘'],
    albums: [albums[1]],
  },
  {
    id: 'ambient-room',
    title: '방의 크기를 바꾸는 앰비언트',
    subtitle: '멜로디보다 공간을 듣는 연습',
    description: '가사와 후렴 없이도 감상이 깊어지는 음반들. 조용히 집중하고 싶은 날의 확장 추천입니다.',
    tags: ['앰비언트', '공간', '집중'],
    albums: [albums[2]],
  },
];

export const albumComments = [
  {
    id: 1,
    albumId: 'mock-album',
    user: 'crate_digger',
    text: '재즈가 어렵다고 느끼는 사람에게 먼저 들려주기 좋은 온도예요. 3번 트랙부터 추천합니다.',
    createdAt: '오늘 09:42',
  },
  {
    id: 2,
    albumId: 'blue-static',
    user: 'warm_noise',
    text: '기타 톤이 거칠지만 멜로디는 의외로 다정해서 계속 돌아오게 됩니다.',
    createdAt: '어제 21:18',
  },
  {
    id: 3,
    albumId: 'orbit-notes',
    user: 'deep_listen',
    text: '처음엔 배경음처럼 들리다가 세 번째부터 공간감이 확 열렸어요.',
    createdAt: '어제 17:06',
  },
];

export const reviews = [
  {
    id: 1,
    album: albums[0],
    user: 'slowlistener',
    rating: 4.5,
    text: '큰 사건 없이도 오래 남는다. 좋은 음악은 결국 분위기를 바꾸는 힘이라는 걸 다시 느꼈다.',
    createdAt: '오늘 12:20',
  },
  {
    id: 2,
    album: albums[1],
    user: 'noisegarden',
    rating: 4,
    text: '완벽하진 않은데 그래서 더 좋다. 망설이는 마음까지 그대로 녹음된 느낌.',
    createdAt: '어제 23:11',
  },
  {
    id: 3,
    album: albums[2],
    user: 'orbiting',
    rating: 5,
    text: '헤드폰을 끼고 들으면 방의 크기가 달라진다. 올해 가장 많이 다시 들은 앨범.',
    createdAt: '어제 18:04',
  },
];
