import type { MetadataRoute } from 'next';

const SITE_URL = 'https://eventbrite-preview.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Don't waste crawler budget on the API routes — they're machine-only
        disallow: ['/api/']
      }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  };
}
