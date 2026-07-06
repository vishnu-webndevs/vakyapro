import type { Metadata } from 'next';
import StaticPage from '@/src/pages/StaticPage';
import PublicLayout from '@/src/components/PublicLayout';

export const metadata: Metadata = {
  title: "Cookie Policy | VakyaPro Legal AI Platform",
  description: "Understand how VakyaPro uses cookies and tracking technologies to optimize user experience and secure legal data on our platform.",
  alternates: {
    canonical: "https://vakyapro.com/cookies",
  },
  openGraph: {
    title: "Cookie Policy | VakyaPro Legal AI Platform",
    description: "Understand how VakyaPro uses cookies and tracking technologies to optimize user experience and secure legal data on our platform.",
    url: "https://vakyapro.com/cookies",
    images: ["/Vakya-pro.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cookie Policy | VakyaPro Legal AI Platform",
    description: "Understand how VakyaPro uses cookies and tracking technologies to optimize user experience and secure legal data on our platform.",
    images: ["/Vakya-pro.png"],
  },
};

export default function CookiesPage() {
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Cookie Policy",
    "description": "Understand how VakyaPro uses cookies and tracking technologies to optimize user experience and secure legal data on our platform.",
    "url": "https://vakyapro.com/cookies"
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
        "name": "Cookie Policy",
        "item": "https://vakyapro.com/cookies"
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
      <StaticPage slug="cookies" />
    </PublicLayout>
  );
}
