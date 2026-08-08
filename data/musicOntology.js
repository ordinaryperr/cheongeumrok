export const musicTagSchema = {
  genre: ['R&B', 'Neo Soul', 'Jazz', 'Soul Jazz', 'Ambient', 'Electronic', 'Post-Punk', 'Indie Rock', 'Shoegaze', 'Hip-Hop', 'Folk'],
  mood: ['night', 'melancholic', 'dreamy', 'warm', 'tense', 'meditative', 'restless', 'romantic', 'lonely', 'euphoric'],
  texture: ['warm vocal', 'dusty', 'noisy', 'spacious', 'minimal', 'dense', 'lo-fi', 'synth-heavy', 'acoustic', 'drone'],
  era: ['1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'],
  difficulty: ['Freshman', 'Sophomore', 'Junior', 'Senior'],
  adjacentGenres: ['Neo Soul', 'Soul Jazz', 'Modal Jazz', 'Spiritual Jazz', 'Drone', 'Minimalism', 'Dream Pop', 'Industrial', 'No Wave', 'Trip-Hop'],
};

export const genreGraph = {
  'R&B': {
    adjacentGenres: ['Neo Soul', 'Soul Jazz', 'Trip-Hop'],
    bridgeMoods: ['night', 'warm', 'melancholic'],
    nextFence: ['Jazz', 'Ambient'],
  },
  'Neo Soul': {
    adjacentGenres: ['Soul Jazz', 'Jazz', 'Hip-Hop'],
    bridgeMoods: ['warm', 'night', 'romantic'],
    nextFence: ['Jazz'],
  },
  Jazz: {
    adjacentGenres: ['Modal Jazz', 'Soul Jazz', 'Spiritual Jazz'],
    bridgeMoods: ['night', 'warm', 'meditative'],
    nextFence: ['Ambient'],
  },
  Ambient: {
    adjacentGenres: ['Drone', 'Minimalism', 'Electronic'],
    bridgeMoods: ['dreamy', 'meditative', 'lonely'],
    nextFence: ['Post-Punk'],
  },
  'Indie Rock': {
    adjacentGenres: ['Post-Punk', 'Shoegaze', 'Dream Pop'],
    bridgeMoods: ['restless', 'melancholic', 'tense'],
    nextFence: ['Post-Punk', 'Ambient'],
  },
  'Post-Punk': {
    adjacentGenres: ['No Wave', 'Industrial', 'Shoegaze'],
    bridgeMoods: ['tense', 'restless', 'lonely'],
    nextFence: ['Ambient', 'Jazz'],
  },
};

export const ontologyKeywordMap = [
  ['jazz', { genre: 'Jazz', mood: 'night', texture: 'spacious' }],
  ['soul', { genre: 'Neo Soul', mood: 'warm', texture: 'warm vocal' }],
  ['r&b', { genre: 'R&B', mood: 'night', texture: 'warm vocal' }],
  ['ambient', { genre: 'Ambient', mood: 'meditative', texture: 'spacious' }],
  ['drone', { genre: 'Ambient', mood: 'meditative', texture: 'drone' }],
  ['indie', { genre: 'Indie Rock', mood: 'restless', texture: 'noisy' }],
  ['rock', { genre: 'Indie Rock', mood: 'restless', texture: 'noisy' }],
  ['post-punk', { genre: 'Post-Punk', mood: 'tense', texture: 'dense' }],
  ['punk', { genre: 'Post-Punk', mood: 'tense', texture: 'dense' }],
  ['dream', { mood: 'dreamy', texture: 'spacious' }],
  ['night', { mood: 'night' }],
  ['밤', { mood: 'night' }],
  ['몽환', { mood: 'dreamy' }],
  ['따뜻', { mood: 'warm', texture: 'warm vocal' }],
  ['노이즈', { texture: 'noisy' }],
  ['공간', { texture: 'spacious' }],
];
