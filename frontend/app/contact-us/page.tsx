import type { Metadata } from 'next';
import StaticPage from '@/src/pages/StaticPage';
import PublicLayout from '@/src/components/PublicLayout';

export const metadata: Metadata = {
  title: "Contact VakyaPro | Get in Touch with Legal AI Experts",
  description: "Have questions about our legal AI platform? Contact our support team or request a demo of VakyaPro's advanced legal prompt engineering solutions.",
  alternates: {
    canonical: "https://vakyapro.com/contact-us",
  },
  openGraph: {
    title: "Contact VakyaPro | Get in Touch with Legal AI Experts",
    description: "Have questions about our legal AI platform? Contact our support team or request a demo of VakyaPro's advanced legal prompt engineering solutions.",
    url: "https://vakyapro.com/contact-us",
    images: ["/Vakya-pro.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact VakyaPro | Get in Touch with Legal AI Experts",
    description: "Have questions about our legal AI platform? Contact our support team or request a demo of VakyaPro's advanced legal prompt engineering solutions.",
    images: ["/Vakya-pro.png"],
  },
};

export default function ContactUsPage() {
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact VakyaPro",
    "description": "Have questions about our legal AI platform? Contact our support team or request a demo of VakyaPro's advanced legal prompt engineering solutions.",
    "url": "https://vakyapro.com/contact-us"
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
        "name": "Contact Us",
        "item": "https://vakyapro.com/contact-us"
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
      <StaticPage slug="contact-us" />
    </PublicLayout>
  );
}
