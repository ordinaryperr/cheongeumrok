export const curriculumTracks = [
  {
    id: 'jazz',
    genre: 'Jazz',
    signal: 'slow tempo · night mood · instrumental space',
    reason: '느린 템포와 밤의 무드를 자주 기록한 리스너가 재즈의 언어로 넘어가는 첫 경로입니다.',
    levels: [
      {
        name: 'Freshman',
        status: 'open',
        description: '장르의 문법을 처음 만나는 학기. 어렵지 않지만 오래 남는 기준점을 듣습니다.',
        albums: ['Miles Davis — Kind of Blue', 'Chet Baker — Chet Baker Sings', 'Bill Evans — Waltz for Debby'],
        requirements: ['Course Albums 5개 기록', '각 앨범 180자 이상 감상', '낯설었던 사운드 3개 기록', '서로 다른 날 3회 이상 재청취', '10일 이상 간격을 두고 완료'],
      },
      {
        name: 'Sophomore',
        status: 'locked',
        description: '연주와 구조를 구분하기 시작하는 단계. 재즈가 배경음악이 아니게 됩니다.',
        albums: ['John Coltrane — A Love Supreme', 'Charles Mingus — Mingus Ah Um', 'Herbie Hancock — Maiden Voyage'],
        requirements: ['Course Albums 8개 기록', '서로 다른 시대 3개 이상 포함', '250자 이상 비교 감상 2개 작성', '장르 용어 5개 직접 정의', '21일 이상 유지'],
      },
      {
        name: 'Junior',
        status: 'locked',
        description: '하위 장르와 역사적 맥락을 듣는 단계. 취향이 구체적인 언어를 얻습니다.',
        albums: ['Wayne Shorter — Speak No Evil', 'Art Blakey — Moanin’', 'Thelonious Monk — Brilliant Corners'],
        requirements: ['Course Albums 12개 기록', '인접 장르 4개 기록', '500자 이상 리뷰 3개', '영향 관계/레이블/시대 태그 작성', '한 앨범을 반대 관점으로 재리뷰'],
      },
      {
        name: 'Senior',
        status: 'locked',
        description: '긴장감, 불협, 긴 호흡을 견디는 학기. 익숙함을 일부러 흔듭니다.',
        albums: ['Ornette Coleman — The Shape of Jazz to Come', 'Eric Dolphy — Out to Lunch!', 'Alice Coltrane — Journey in Satchidananda'],
        requirements: ['고난도 앨범 6개 기록', '반대 취향 앨범 4개 기록', '800자 이상 리뷰 3개', '직접 큐레이션 2개 제작', '30일 이상 리스닝 로그 유지'],
      },
    ],
  },
  {
    id: 'ambient',
    genre: 'Ambient',
    signal: 'dreamy · texture · focus listening',
    reason: '몽환적인 질감과 느린 흐름을 좋아한다면, 멜로디보다 공간을 듣는 연습으로 이어집니다.',
    levels: [
      { name: 'Freshman', status: 'open', description: '공간과 반복을 편안하게 받아들이는 첫 단계.', albums: ['Brian Eno — Music for Airports', 'Hiroshi Yoshimura — Green', 'Aphex Twin — Selected Ambient Works 85–92'], requirements: ['Course Albums 5개 기록', '청취 상황 태그 5개 작성', '180자 이상 감상', '반복해서 들은 구간 3개 기록', '무언가 하지 않고 앉아서 1회 완청'] },
      { name: 'Sophomore', status: 'locked', description: '배경과 감상의 경계가 흐려지는 단계.', albums: ['Stars of the Lid — And Their Refinement of the Decline', 'The KLF — Chill Out', 'Harold Budd — The Pavilion of Dreams'], requirements: ['Course Albums 8개 기록', '소리 질감 비교표 작성', '21일 이상 유지', '250자 이상 비교 감상 2개', '무드가 아닌 구조로 설명하기'] },
      { name: 'Junior', status: 'locked', description: '노이즈, 드론, 전자음의 차이를 듣습니다.', albums: ['Tim Hecker — Ravedeath, 1972', 'Fennesz — Endless Summer', 'William Basinski — The Disintegration Loops'], requirements: ['Course Albums 12개 기록', '500자 리뷰 3개', '낯선 질감 태그 7개', '인접 장르 4개', '불편했던 앨범 1개 재청취'] },
      { name: 'Senior', status: 'locked', description: '편안함을 넘어 불안과 몰입을 견디는 단계.', albums: ['La Monte Young — The Well-Tuned Piano', 'Grouper — Dragging a Dead Deer Up a Hill', 'Oneohtrix Point Never — Replica'], requirements: ['고난도 앨범 6개', '긴 호흡 감상 4개', '반대 취향 기록 3개', '큐레이션 2개', '30분 이상 단일 트랙 완청 기록'] },
    ],
  },
  {
    id: 'post-punk',
    genre: 'Post-Punk',
    signal: 'rhythm · tension · cold vocal',
    reason: '차가운 사운드와 긴장감 있는 리듬으로 익숙한 록/팝의 바깥을 엽니다.',
    levels: [
      { name: 'Freshman', status: 'open', description: '선명한 리듬과 어두운 분위기로 시작합니다.', albums: ['Joy Division — Unknown Pleasures', 'Talking Heads — Remain in Light', 'The Cure — Seventeen Seconds'], requirements: ['Course Albums 5개 기록', '리듬/보컬 태그 5개 작성', '180자 감상', '10일 이상 유지', '가장 불편했던 요소 기록'] },
      { name: 'Sophomore', status: 'locked', description: '펑크 이후의 실험과 댄서블한 긴장을 듣습니다.', albums: ['Gang of Four — Entertainment!', 'Wire — Chairs Missing', 'Siouxsie and the Banshees — Juju'], requirements: ['Course Albums 8개', '250자 이상 비교 감상 2개', '시대 차이 기록 3개', '21일 이상 유지', '밴드별 리듬 접근 차이 설명'] },
      { name: 'Junior', status: 'locked', description: '지역과 장면의 차이가 들리기 시작합니다.', albums: ['The Fall — Hex Enduction Hour', 'This Heat — Deceit', 'Pere Ubu — Dub Housing'], requirements: ['Course Albums 12개', '500자 리뷰 3개', '인접 장르 4개 기록', '영향 관계 태그 5개', '장면/지역 차이 비교'] },
      { name: 'Senior', status: 'locked', description: '불편한 반복과 거친 질감을 통과합니다.', albums: ['Public Image Ltd — Metal Box', 'Swans — Filth', 'The Pop Group — Y'], requirements: ['고난도 앨범 6개', '반대 취향 4개', '800자 리뷰 3개', '큐레이션 2개 제작', '가장 거부감 든 앨범 재리뷰'] },
    ],
  },
];
