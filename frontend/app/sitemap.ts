import { MetadataRoute } from 'next';
import { getApiBaseUrl } from '@/src/config/apiBase';

export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://vakyapro.com';
  const apiBaseUrl = getApiBaseUrl();

  // Static routes
  const routes = [
    '',
    '/about-us',
    '/contact-us',
    '/cookies',
    '/plans',
    '/privacy-policy',
    '/terms',
    '/blog',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Fetch dynamic blog routes
  try {
    const res = await fetch(`${apiBaseUrl}/api/blogs?per_page=100`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      const blogs = json.data || [];
      const blogRoutes = blogs.map((blog: { slug: string; updated_at?: string }) => ({
        url: `${baseUrl}/blog/${blog.slug}`,
        lastModified: blog.updated_at ? new Date(blog.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
      return [...routes, ...blogRoutes];
    }
  } catch (e) {
    console.error('Sitemap build failed to fetch blogs:', e);
  }

  return routes;
}
