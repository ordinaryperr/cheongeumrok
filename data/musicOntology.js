export const musicTagSchema = {
  genre: ['R&B', 'Neo Soul', 'Jazz', 'Soul Jazz', 'Ambient', 'Electronic', 'Post-Punk', 'Indie Rock', 'Shoegaze', 'Hip-Hop', 'Dubstep', 'Metal', 'Experimental', 'Classical', 'Contemporary Classical', 'Folk'],
  mood: ['night', 'melancholic', 'dreamy', 'warm', 'tense', 'meditative', 'restless', 'romantic', 'lonely', 'euphoric'],
  texture: ['warm vocal', 'dusty', 'noisy', 'spacious', 'minimal', 'dense', 'lo-fi', 'synth-heavy', 'acoustic', 'drone'],
  era: ['1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'],
  difficulty: ['Freshman', 'Sophomore', 'Junior', 'Senior'],
  adjacentGenres: ['Neo Soul', 'Soul Jazz', 'Modal Jazz', 'Spiritual Jazz', 'Drone', 'Minimalism', 'Dream Pop', 'Industrial', 'No Wave', 'Trip-Hop', 'Bass Music', 'Noise', 'Contemporary Classical'],
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
  'Hip-Hop': {
    adjacentGenres: ['Neo Soul', 'R&B', 'Trip-Hop'],
    bridgeMoods: ['restless', 'night', 'tense'],
    nextFence: ['Dubstep', 'Jazz'],
  },
  Dubstep: {
    adjacentGenres: ['Bass Music', 'UK Garage', 'Ambient'],
    bridgeMoods: ['tense', 'lonely', 'meditative'],
    nextFence: ['Electronic', 'Experimental'],
  },
  Electronic: {
    adjacentGenres: ['Ambient', 'Dubstep', 'Minimalism'],
    bridgeMoods: ['euphoric', 'restless', 'meditative'],
    nextFence: ['Experimental', 'Classical'],
  },
  Shoegaze: {
    adjacentGenres: ['Dream Pop', 'Noise', 'Post-Punk'],
    bridgeMoods: ['dreamy', 'melancholic', 'lonely'],
    nextFence: ['Ambient', 'Metal'],
  },
  Metal: {
    adjacentGenres: ['Industrial', 'Noise', 'Shoegaze'],
    bridgeMoods: ['tense', 'restless', 'dense'],
    nextFence: ['Experimental', 'Classical'],
  },
  Experimental: {
    adjacentGenres: ['Noise', 'Ambient', 'Contemporary Classical'],
    bridgeMoods: ['tense', 'meditative', 'restless'],
    nextFence: ['Classical', 'Ambient'],
  },
  Classical: {
    adjacentGenres: ['Contemporary Classical', 'Minimalism', 'Ambient'],
    bridgeMoods: ['meditative', 'melancholic', 'spacious'],
    nextFence: ['Experimental', 'Ambient'],
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
  ['hip-hop', { genre: 'Hip-Hop', mood: 'restless', texture: 'dusty' }],
  ['rap', { genre: 'Hip-Hop', mood: 'restless', texture: 'dusty' }],
  ['sampling', { genre: 'Hip-Hop', texture: 'dusty' }],
  ['dubstep', { genre: 'Dubstep', mood: 'tense', texture: 'dense' }],
  ['bass', { genre: 'Dubstep', mood: 'tense', texture: 'dense' }],
  ['electronic', { genre: 'Electronic', mood: 'euphoric', texture: 'synth-heavy' }],
  ['techno', { genre: 'Electronic', mood: 'euphoric', texture: 'minimal' }],
  ['shoegaze', { genre: 'Shoegaze', mood: 'dreamy', texture: 'noisy' }],
  ['metal', { genre: 'Metal', mood: 'tense', texture: 'dense' }],
  ['riff', { genre: 'Metal', texture: 'dense' }],
  ['experimental', { genre: 'Experimental', mood: 'restless', texture: 'noisy' }],
  ['classical', { genre: 'Classical', mood: 'meditative', texture: 'acoustic' }],
  ['contemporary classical', { genre: 'Contemporary Classical', mood: 'meditative', texture: 'minimal' }],
  ['dream', { mood: 'dreamy', texture: 'spacious' }],
  ['night', { mood: 'night' }],
  ['밤', { mood: 'night' }],
  ['몽환', { mood: 'dreamy' }],
  ['따뜻', { mood: 'warm', texture: 'warm vocal' }],
  ['노이즈', { texture: 'noisy' }],
  ['공간', { texture: 'spacious' }],
];
