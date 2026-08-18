export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/'],
    },
    sitemap: 'https://cheongeumrok.vercel.app/sitemap.xml',
  };
}
