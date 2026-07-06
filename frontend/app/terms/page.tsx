import type { Metadata } from 'next';
import StaticPage from '@/src/pages/StaticPage';
import PublicLayout from '@/src/components/PublicLayout';

export const metadata: Metadata = {
  title: "Terms of Service | VakyaPro Legal AI Platform",
  description: "Review the terms and conditions governing the use of the VakyaPro AI-powered legal technology platform and associated subscription services.",
  alternates: {
    canonical: "https://vakyapro.com/terms",
  },
  openGraph: {
    title: "Terms of Service | VakyaPro Legal AI Platform",
    description: "Review the terms and conditions governing the use of the VakyaPro AI-powered legal technology platform and associated subscription services.",
    url: "https://vakyapro.com/terms",
    images: ["/Vakya-pro.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | VakyaPro Legal AI Platform",
    description: "Review the terms and conditions governing the use of the VakyaPro AI-powered legal technology platform and associated subscription services.",
    images: ["/Vakya-pro.png"],
  },
};

export default function TermsPage() {
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Terms of Service",
    "description": "Review the terms and conditions governing the use of the VakyaPro AI-powered legal technology platform and associated subscription services.",
    "url": "https://vakyapro.com/terms"
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
        "name": "Terms of Service",
        "item": "https://vakyapro.com/terms"
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
      <StaticPage slug="terms" />
    </PublicLayout>
  );
}
