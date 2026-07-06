import type { Metadata } from 'next';
import { Suspense } from 'react';
import BlogIndex from '@/src/pages/BlogIndex';
import PublicLayout from '@/src/components/PublicLayout';

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

export default function BlogPage() {
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
      <Suspense fallback={<div className="text-gray-400 p-8 text-center">Loading blog...</div>}>
        <BlogIndex />
      </Suspense>
    </PublicLayout>
  );
}
