export default function sitemap() {
  const base = 'https://cheongeumrok.vercel.app';
  return [
    '',
    '/search',
    '/reviews',
    '/archive',
    '/beyond-your-fence',
    '/news',
    '/about',
    '/login',
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));
}
