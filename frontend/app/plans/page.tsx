import type { Metadata } from 'next';
import PricingSection from '@/src/components/PricingSection';
import PublicLayout from '@/src/components/PublicLayout';

export const metadata: Metadata = {
  title: "VakyaPro Pricing & Subscription Plans | Legal AI Platform",
  description: "Explore our flexible pricing tiers and plans tailored for independent lawyers, legal draftsmen, and enterprise law firms.",
  alternates: {
    canonical: "https://vakyapro.com/plans",
  },
  openGraph: {
    title: "VakyaPro Pricing & Subscription Plans | Legal AI Platform",
    description: "Explore our flexible pricing tiers and plans tailored for independent lawyers, legal draftsmen, and enterprise law firms.",
    url: "https://vakyapro.com/plans",
    images: ["/Vakya-pro.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "VakyaPro Pricing & Subscription Plans | Legal AI Platform",
    description: "Explore our flexible pricing tiers and plans tailored for independent lawyers, legal draftsmen, and enterprise law firms.",
    images: ["/Vakya-pro.png"],
  },
};

export default function PlansPage() {
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "VakyaPro Subscription Plans",
    "image": "https://vakyapro.com/Vakya-pro.png",
    "description": "Flexible pricing plans for legal draftsmen, lawyers, and enterprise law firms on the VakyaPro Legal AI platform.",
    "brand": {
      "@type": "Brand",
      "name": "VakyaPro"
    },
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "USD",
      "lowPrice": "0",
      "highPrice": "199",
      "offerCount": "3"
    }
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
        "name": "Pricing & Plans",
        "item": "https://vakyapro.com/plans"
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
      <PricingSection variant="full" />
    </PublicLayout>
  );
}
