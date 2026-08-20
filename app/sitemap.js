export default function sitemap() {
  const base = 'https://cheongeumrok.vercel.app';
  const corePaths = [
    '',
    '/search',
    '/reviews',
    '/archive',
    '/beyond-your-fence',
    '/news',
    '/about',
    '/login',
  ];
  const beyondGenres = ['jazz', 'ambient', 'post-punk', 'hip-hop', 'dubstep', 'r-and-b', 'electronic', 'shoegaze', 'metal', 'experimental', 'classical'];
  const archiveGenres = ['jazz', 'ambient', 'post-punk', 'hip-hop', 'dubstep', 'r-and-b', 'electronic', 'shoegaze', 'metal', 'experimental', 'classical'];
  const paths = [
    ...corePaths,
    ...beyondGenres.map((genre) => `/beyond-your-fence?genre=${genre}`),
    ...archiveGenres.map((genre) => `/archive?genre=${genre}`),
  ];

  return paths.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));
}
