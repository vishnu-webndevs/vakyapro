import type { Metadata } from 'next';
import StaticPage from '@/src/pages/StaticPage';
import PublicLayout from '@/src/components/PublicLayout';

export const metadata: Metadata = {
  title: "About VakyaPro | Enterprise Legal AI Technology",
  description: "Learn about the mission and team behind VakyaPro. We are dedicated to bridging the gap between legal expertise and advanced artificial intelligence to automate draft creation and document analysis.",
  alternates: {
    canonical: "https://vakyapro.com/about-us",
  },
  openGraph: {
    title: "About VakyaPro | Enterprise Legal AI Technology",
    description: "Learn about the mission and team behind VakyaPro. We are dedicated to bridging the gap between legal expertise and advanced artificial intelligence to automate draft creation and document analysis.",
    url: "https://vakyapro.com/about-us",
    images: ["/Vakya-pro.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "About VakyaPro | Enterprise Legal AI Technology",
    description: "Learn about the mission and team behind VakyaPro. We are dedicated to bridging the gap between legal expertise and advanced artificial intelligence to automate draft creation and document analysis.",
    images: ["/Vakya-pro.png"],
  },
};

export default function AboutUsPage() {
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About VakyaPro",
    "description": "Learn about the mission and team behind VakyaPro.",
    "url": "https://vakyapro.com/about-us"
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
        "name": "About Us",
        "item": "https://vakyapro.com/about-us"
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
      <StaticPage slug="about-us" />
    </PublicLayout>
  );
}
