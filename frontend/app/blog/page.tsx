import type { Metadata } from 'next';
import { Suspense } from 'react';
import BlogIndex from '@/src/pages/BlogIndex';
import PublicLayout from '@/src/components/PublicLayout';
import { getApiBaseUrl } from '@/src/config/apiBase';

export const metadata: Metadata = {
  title: "VakyaPro Legal AI Blog | Guides, Tips & Industry Insights",
  description: "Stay updated with the latest in legal technology, prompt engineering for lawyers, AI compliance, and practice management tips.",
  alternates: {
    canonical: "https://vakyapro.com/blog",
  },
  openGraph: {
    title: "VakyaPro Legal AI Blog | Guides, Tips & Industry Insights",
    description: "Stay updated with the latest in legal technology, prompt engineering for lawyers, AI compliance, and practice management tips.",
    url: "https://vakyapro.com/blog",
    images: ["/Vakya-pro.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "VakyaPro Legal AI Blog | Guides, Tips & Industry Insights",
    description: "Stay updated with the latest in legal technology, prompt engineering for lawyers, AI compliance, and practice management tips.",
    images: ["/Vakya-pro.png"],
  },
};

export default async function BlogPage() {
  const apiBaseUrl = getApiBaseUrl();
  let initialBlogs = null;
  let initialCategories = null;

  try {
    const [blogsRes, categoriesRes] = await Promise.all([
      fetch(`${apiBaseUrl}/api/blogs?per_page=10&page=1`, { headers: { Accept: 'application/json' } }),
      fetch(`${apiBaseUrl}/api/categories`, { headers: { Accept: 'application/json' } }),
    ]);

    if (blogsRes.ok) {
      initialBlogs = await blogsRes.json();
    }
    if (categoriesRes.ok) {
      initialCategories = await categoriesRes.json();
    }
  } catch (e) {
    console.error('Failed to pre-fetch blogs and categories for server indexation', e);
  }

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Legal AI Blog",
    "description": "Stay updated with the latest in legal technology, prompt engineering for lawyers, AI compliance, and practice management tips.",
    "url": "https://vakyapro.com/blog"
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://vakyapro.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "https://vakyapro.com/blog"
      }
    ]
  };

  return (
    <PublicLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-2">
          <h1 className="text-3xl sm:text-4xl font-bold">Blog</h1>
          <p className="mt-2 text-gray-400">Guides, tips, and updates about prompts and productivity.</p>
        </header>
      </div>
      <Suspense fallback={<div className="text-gray-400 p-8 text-center">Loading blog...</div>}>
        <BlogIndex initialBlogs={initialBlogs} initialCategories={initialCategories} />
      </Suspense>
    </PublicLayout>
  );
}
