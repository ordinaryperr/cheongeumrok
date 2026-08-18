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
};

export function getCuratedAlbumId(value) {
  return curatedAlbumIds[normalizeAlbumKey(value)] || null;
}
