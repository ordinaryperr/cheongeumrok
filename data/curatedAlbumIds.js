function normalizeAlbumKey(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[—–-]/g, ' ')
    .replace(/[^a-z0-9가-힣&]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const curatedAlbumIds = {
  [normalizeAlbumKey('Miles Davis — Kind of Blue')]: '1weenld61qoidwYuZ1GESA',
  [normalizeAlbumKey('Miles Davis Kind of Blue')]: '1weenld61qoidwYuZ1GESA',
  [normalizeAlbumKey('Chet Baker — Chet Baker Sings')]: '5JJ779nrbHx0KB2lBrMMa4',
  [normalizeAlbumKey('Chet Baker Sings')]: '5JJ779nrbHx0KB2lBrMMa4',
  [normalizeAlbumKey('Bill Evans — Waltz for Debby')]: '0MjlKhtsyax9HSWNkYaWM2',
  [normalizeAlbumKey('Bill Evans Waltz for Debby')]: '0MjlKhtsyax9HSWNkYaWM2',

  [normalizeAlbumKey('Brian Eno — Music for Airports')]: '063f8Ej8rLVTz9KkjQKEMa',
  [normalizeAlbumKey('Brian Eno Music for Airports')]: '063f8Ej8rLVTz9KkjQKEMa',
  [normalizeAlbumKey('Hiroshi Yoshimura — Green')]: '1tA76N9gawQrNcDkhGXx1A',
  [normalizeAlbumKey('Hiroshi Yoshimura Green')]: '1tA76N9gawQrNcDkhGXx1A',
  [normalizeAlbumKey('Aphex Twin — Selected Ambient Works 85–92')]: '7aNclGRxTysfh6z0d8671k',
  [normalizeAlbumKey('Aphex Twin Selected Ambient Works 85-92')]: '7aNclGRxTysfh6z0d8671k',

  [normalizeAlbumKey('Joy Division — Unknown Pleasures')]: '33qkK1brpt6t8unIpeM2Oy',
  [normalizeAlbumKey('Joy Division Unknown Pleasures')]: '33qkK1brpt6t8unIpeM2Oy',
  [normalizeAlbumKey('Talking Heads — Remain in Light')]: '1JvXxLsm0PxlGH4LXzqMGq',
  [normalizeAlbumKey('Talking Heads Remain in Light')]: '1JvXxLsm0PxlGH4LXzqMGq',
  [normalizeAlbumKey('The Cure — Seventeen Seconds')]: '6hmiQJ6FbPEQIDeKEIKSck',
  [normalizeAlbumKey('The Cure Seventeen Seconds')]: '6hmiQJ6FbPEQIDeKEIKSck',

  [normalizeAlbumKey('A Tribe Called Quest — The Low End Theory')]: '1p12OAWwudgMqfMzjMvl2a',
  [normalizeAlbumKey('A Tribe Called Quest The Low End Theory')]: '1p12OAWwudgMqfMzjMvl2a',
  [normalizeAlbumKey('Nas — Illmatic')]: '3kEtdS2pH6hKcMU9Wioob1',
  [normalizeAlbumKey('Nas Illmatic')]: '3kEtdS2pH6hKcMU9Wioob1',
  [normalizeAlbumKey('Kendrick Lamar — To Pimp a Butterfly')]: '7ycBtnsMtyVbbwTfJwRjSP',
  [normalizeAlbumKey('Kendrick Lamar To Pimp a Butterfly')]: '7ycBtnsMtyVbbwTfJwRjSP',

  [normalizeAlbumKey('Burial — Untrue')]: '1iRPiEYHIX2zpF8lkW54SK',
  [normalizeAlbumKey('Burial Untrue')]: '1iRPiEYHIX2zpF8lkW54SK',
  [normalizeAlbumKey('Skream — Skream!')]: '4kAP0qTz4ZDZULNe78e4Nt',
  [normalizeAlbumKey('Skream Skream!')]: '4kAP0qTz4ZDZULNe78e4Nt',
  [normalizeAlbumKey('Kode9 — Memories of the Future')]: '5pzzcf5f4XrtraLFkwaArO',
  [normalizeAlbumKey('Kode9 Memories of the Future')]: '5pzzcf5f4XrtraLFkwaArO',

  [normalizeAlbumKey('D’Angelo — Voodoo')]: '2lO9yuuIDgBpSJzxTh3ai8',
  [normalizeAlbumKey('D’Angelo Voodoo')]: '2lO9yuuIDgBpSJzxTh3ai8',
  [normalizeAlbumKey('Erykah Badu — Mama’s Gun')]: '3cADvHRdKniF9ELCn1zbGH',
  [normalizeAlbumKey('Erykah Badu Mama’s Gun')]: '3cADvHRdKniF9ELCn1zbGH',
  [normalizeAlbumKey('SZA — Ctrl')]: '76290XdXVF9rPzGdNRWdCh',
  [normalizeAlbumKey('SZA Ctrl')]: '76290XdXVF9rPzGdNRWdCh',

  [normalizeAlbumKey('Daft Punk — Homework')]: '5uRdvUR7xCnHmUW8n64n9y',
  [normalizeAlbumKey('Daft Punk Homework')]: '5uRdvUR7xCnHmUW8n64n9y',
  [normalizeAlbumKey('The Chemical Brothers — Dig Your Own Hole')]: '0FjHy5dCyVROqDUl6f2VTK',
  [normalizeAlbumKey('The Chemical Brothers Dig Your Own Hole')]: '0FjHy5dCyVROqDUl6f2VTK',
  [normalizeAlbumKey('Underworld — Dubnobasswithmyheadman')]: '3WQpmFc7GonmzN40EjbbKY',
  [normalizeAlbumKey('Underworld Dubnobasswithmyheadman')]: '3WQpmFc7GonmzN40EjbbKY',

  [normalizeAlbumKey('My Bloody Valentine — Loveless')]: '3USQKOw0se5pBNEndu82Rb',
  [normalizeAlbumKey('My Bloody Valentine Loveless')]: '3USQKOw0se5pBNEndu82Rb',
  [normalizeAlbumKey('Slowdive — Souvlaki')]: '53eHm1f3sFiSzWMaKOl98Z',
  [normalizeAlbumKey('Slowdive Souvlaki')]: '53eHm1f3sFiSzWMaKOl98Z',
  [normalizeAlbumKey('Cocteau Twins — Heaven or Las Vegas')]: '5lEphbceIgaK1XxWeSrC9E',
  [normalizeAlbumKey('Cocteau Twins Heaven or Las Vegas')]: '5lEphbceIgaK1XxWeSrC9E',

  [normalizeAlbumKey('Black Sabbath — Paranoid')]: '4kA2o0L3tz9vFKJetiFUJI',
  [normalizeAlbumKey('Black Sabbath Paranoid')]: '4kA2o0L3tz9vFKJetiFUJI',
  [normalizeAlbumKey('Metallica — Master of Puppets')]: '2Lq2qX3hYhiuPckC8Flj21',
  [normalizeAlbumKey('Metallica Master of Puppets')]: '2Lq2qX3hYhiuPckC8Flj21',
  [normalizeAlbumKey('Deftones — White Pony')]: '5LEXck3kfixFaA3CqVE7bC',
  [normalizeAlbumKey('Deftones White Pony')]: '5LEXck3kfixFaA3CqVE7bC',

  [normalizeAlbumKey('Björk — Vespertine')]: '7sScYIMy44GyOll7TpWcak',
  [normalizeAlbumKey('Björk Vespertine')]: '7sScYIMy44GyOll7TpWcak',
};

const curatedAlbumFallbacks = {
  '1weenld61qoidwYuZ1GESA': { title: 'Kind Of Blue', artist: 'Miles Davis', coverUrl: 'https://i.scdn.co/image/ab67616d0000b273387a29c90de3b2398c29c34f' },
  '5JJ779nrbHx0KB2lBrMMa4': { title: 'Chet Baker Sings', artist: 'Chet Baker', coverUrl: 'https://i.scdn.co/image/ab67616d0000b273f12f8e33e377ba119ecbd26b' },
  '0MjlKhtsyax9HSWNkYaWM2': { title: 'Waltz For Debby', artist: 'Bill Evans Trio', coverUrl: 'https://i.scdn.co/image/ab67616d0000b273b97f82fd92c92369eafd9a47' },
  '063f8Ej8rLVTz9KkjQKEMa': { title: 'Ambient 1: Music For Airports', artist: 'Brian Eno', coverUrl: 'https://i.scdn.co/image/ab67616d0000b27337a379ca6520eaf191de6ff2' },
  '1tA76N9gawQrNcDkhGXx1A': { title: 'Green', artist: 'Hiroshi Yoshimura', coverUrl: 'https://i.scdn.co/image/ab67616d0000b273f5c039e15a8c177829ce1252' },
  '7aNclGRxTysfh6z0d8671k': { title: 'Selected Ambient Works 85-92', artist: 'Aphex Twin', coverUrl: 'https://i.scdn.co/image/ab67616d0000b27338906032688bb13b135ce19a' },
  '33qkK1brpt6t8unIpeM2Oy': { title: 'Unknown Pleasures', artist: 'Joy Division', coverUrl: 'https://i.scdn.co/image/ab67616d0000b27316eb1e685e6bd37ab3228de6' },
  '1JvXxLsm0PxlGH4LXzqMGq': { title: 'Remain in Light', artist: 'Talking Heads', coverUrl: 'https://i.scdn.co/image/ab67616d0000b273e49a405217bda217816f7bf5' },
  '6hmiQJ6FbPEQIDeKEIKSck': { title: 'Seventeen Seconds', artist: 'The Cure', coverUrl: 'https://i.scdn.co/image/ab67616d0000b2734f6d78b7fb2ba87ed33fcd7e' },
  '1p12OAWwudgMqfMzjMvl2a': { title: 'The Low End Theory', artist: 'A Tribe Called Quest', coverUrl: 'https://i.scdn.co/image/ab67616d0000b273f38c6b37a21334e22005b1f7' },
  '3kEtdS2pH6hKcMU9Wioob1': { title: 'Illmatic', artist: 'Nas', coverUrl: 'https://i.scdn.co/image/ab67616d0000b27371d840defb002ed3b180f7cd' },
  '7ycBtnsMtyVbbwTfJwRjSP': { title: 'To Pimp A Butterfly', artist: 'Kendrick Lamar', coverUrl: 'https://i.scdn.co/image/ab67616d0000b273cdb645498cd3d8a2db4d05e1' },
  '1iRPiEYHIX2zpF8lkW54SK': { title: 'Untrue', artist: 'Burial', coverUrl: 'https://i.scdn.co/image/ab67616d0000b27355018696782c175bdbaa3b5d' },
  '4kAP0qTz4ZDZULNe78e4Nt': { title: 'Skream!', artist: 'Skream', coverUrl: 'https://i.scdn.co/image/ab67616d0000b2739e7fe70b7a95aa05f59777e7' },
  '5pzzcf5f4XrtraLFkwaArO': { title: 'Memories of the Future', artist: 'Kode9, The Spaceape', coverUrl: 'https://i.scdn.co/image/ab67616d0000b273d95e6f05c4ed7496d3cfe3cf' },
  '2lO9yuuIDgBpSJzxTh3ai8': { title: 'Voodoo', artist: "D'Angelo", coverUrl: 'https://i.scdn.co/image/ab67616d0000b2732b3dc336a7a69293c25d9ade' },
  '3cADvHRdKniF9ELCn1zbGH': { title: "Mama's Gun", artist: 'Erykah Badu', coverUrl: 'https://i.scdn.co/image/ab67616d0000b2730d934cb462fae5a26f829efb' },
  '76290XdXVF9rPzGdNRWdCh': { title: 'Ctrl', artist: 'SZA', coverUrl: 'https://i.scdn.co/image/ab67616d0000b27306d56b057cce5797538a16d5' },
  '5uRdvUR7xCnHmUW8n64n9y': { title: 'Homework', artist: 'Daft Punk', coverUrl: 'https://i.scdn.co/image/ab67616d0000b2738ac778cc7d88779f74d33311' },
  '0FjHy5dCyVROqDUl6f2VTK': { title: 'Dig Your Own Hole', artist: 'The Chemical Brothers', coverUrl: 'https://i.scdn.co/image/ab67616d0000b273df9f87a1ff07a1bb500ad75f' },
  '3WQpmFc7GonmzN40EjbbKY': { title: 'Dubnobasswithmyheadman', artist: 'Underworld', coverUrl: 'https://i.scdn.co/image/ab67616d0000b27364f0ae6040dc56a925cb67a9' },
  '3USQKOw0se5pBNEndu82Rb': { title: 'loveless', artist: 'my bloody valentine', coverUrl: 'https://i.scdn.co/image/ab67616d0000b273db8e38addb58131f77b48377' },
  '53eHm1f3sFiSzWMaKOl98Z': { title: 'Souvlaki', artist: 'Slowdive', coverUrl: 'https://i.scdn.co/image/ab67616d0000b273f6e31941d10e4819d290af41' },
  '5lEphbceIgaK1XxWeSrC9E': { title: 'Heaven or Las Vegas', artist: 'Cocteau Twins', coverUrl: 'https://i.scdn.co/image/ab67616d0000b273fe6211303e796f3d5b7a0e02' },
  '4kA2o0L3tz9vFKJetiFUJI': { title: 'Paranoid', artist: 'Black Sabbath', coverUrl: 'https://i.scdn.co/image/ab67616d0000b273605b25c031f809d78054a13c' },
  '2Lq2qX3hYhiuPckC8Flj21': { title: 'Master Of Puppets', artist: 'Metallica', coverUrl: 'https://i.scdn.co/image/ab67616d0000b273668e3aca3167e6e569a9aa20' },
  '5LEXck3kfixFaA3CqVE7bC': { title: 'White Pony', artist: 'Deftones', coverUrl: 'https://i.scdn.co/image/ab67616d0000b2735c53799f473fa3e1a48c00ed' },
  '7sScYIMy44GyOll7TpWcak': { title: 'Vespertine', artist: 'Björk', year: '2001', coverUrl: 'https://i.scdn.co/image/ab67616d0000b2735c081511ab5779f399233349' },
};

export function getCuratedAlbumId(value) {
  return curatedAlbumIds[normalizeAlbumKey(value)] || null;
}

export function getCuratedAlbumFallbackById(id) {
  const fallback = curatedAlbumFallbacks[id];
  return fallback ? { id, type: 'album', year: fallback.year || '', releaseDate: fallback.year || '', totalTracks: null, externalUrl: `https://open.spotify.com/album/${id}`, ...fallback } : null;
}

export function getCuratedAlbumFallback(value) {
  const id = getCuratedAlbumId(value);
  if (!id) return null;
  return getCuratedAlbumFallbackById(id);
}
