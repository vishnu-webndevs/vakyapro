import type { Metadata } from 'next';
import StaticPage from '@/src/pages/StaticPage';
import PublicLayout from '@/src/components/PublicLayout';

export const metadata: Metadata = {
  title: "Privacy Policy | VakyaPro Legal AI Platform",
  description: "Read our comprehensive privacy policy outlining how VakyaPro collects, uses, and secures client data in compliance with professional standards.",
  alternates: {
    canonical: "https://vakyapro.com/privacy-policy",
  },
  openGraph: {
    title: "Privacy Policy | VakyaPro Legal AI Platform",
    description: "Read our comprehensive privacy policy outlining how VakyaPro collects, uses, and secures client data in compliance with professional standards.",
    url: "https://vakyapro.com/privacy-policy",
    images: ["/Vakya-pro.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | VakyaPro Legal AI Platform",
    description: "Read our comprehensive privacy policy outlining how VakyaPro collects, uses, and secures client data in compliance with professional standards.",
    images: ["/Vakya-pro.png"],
  },
};

export default function PrivacyPolicyPage() {
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Privacy Policy",
    "description": "Read our comprehensive privacy policy outlining how VakyaPro collects, uses, and secures client data in compliance with professional standards.",
    "url": "https://vakyapro.com/privacy-policy"
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
        "name": "Privacy Policy",
        "item": "https://vakyapro.com/privacy-policy"
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
      <StaticPage slug="privacy-policy" />
    </PublicLayout>
  );
}
