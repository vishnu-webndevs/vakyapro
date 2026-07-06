import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/about-us',
        '/contact-us',
        '/cookies',
        '/plans',
        '/privacy-policy',
        '/terms',
        '/blog',
        '/blog/*',
      ],
      disallow: [
        '/admin',
        '/admin/*',
        '/api',
        '/api/*',
        '/delete-account',
        '/*?*', // Block parameter URLs like ?utm=, ?fbclid=, ?gclid=, ?p=, ?id=
      ],
    },
    sitemap: 'https://vakyapro.com/sitemap.xml',
  };
}
