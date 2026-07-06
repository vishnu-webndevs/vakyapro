import type { Metadata } from 'next';
import HeroSection from '@/src/components/HeroSection';
import SmartInterrogator from '@/src/components/SmartInterrogator';
import HowItWorks from '@/src/components/HowItWorks';
import Testimonials from '@/src/components/Testimonials';
import WaitlistCTA from '@/src/components/WaitlistCTA';
import PricingSection from '@/src/components/PricingSection';
import PublicLayout from '@/src/components/PublicLayout';

export const metadata: Metadata = {
  title: "VakyaPro - Enterprise AI-Powered Legal Technology Platform",
  description: "VakyaPro is a professional AI-powered legal technology platform designed for law firms and legal professionals. Create precise legal drafts, streamline document analysis, and leverage smart AI prompt engineering for legal workflows.",
  alternates: {
    canonical: "https://vakyapro.com",
  },
  openGraph: {
    title: "VakyaPro - Enterprise AI-Powered Legal Technology Platform",
    description: "VakyaPro is a professional AI-powered legal technology platform designed for law firms and legal professionals. Create precise legal drafts and automate document workflows.",
    url: "https://vakyapro.com",
    images: ["/Vakya-pro.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "VakyaPro - Enterprise AI-Powered Legal Technology Platform",
    description: "VakyaPro is a professional AI-powered legal technology platform designed for law firms and legal professionals. Create precise legal drafts and automate document workflows.",
    images: ["/Vakya-pro.png"],
  },
};

export default function Home() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://vakyapro.com"
      }
    ]
  };

  return (
    <PublicLayout>
      {/* Page Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <HeroSection />
      <section id="features">
        <SmartInterrogator />
      </section>
      <section id="how-it-works">
        <HowItWorks />
      </section>
      <section id="pricing">
        <PricingSection variant="homepage" />
      </section>
      <Testimonials />
      <section id="roadmap" className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Product Roadmap
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              What we’re building next to make prompt creation faster and smarter.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-800 bg-black/40 backdrop-blur-xl p-6">
              <h3 className="text-lg font-semibold mb-2">More templates</h3>
              <p className="text-gray-400 text-sm">
                Ready-to-use prompt templates for marketing, support, coding, and creators.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-black/40 backdrop-blur-xl p-6">
              <h3 className="text-lg font-semibold mb-2">Better personalization</h3>
              <p className="text-gray-400 text-sm">
                Save your tone, audience, and goals to generate consistent prompts every time.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-black/40 backdrop-blur-xl p-6">
              <h3 className="text-lg font-semibold mb-2">Deeper analytics</h3>
              <p className="text-gray-400 text-sm">
                Understand what works with prompt performance insights and iteration history.
              </p>
            </div>
          </div>
        </div>
      </section>
      <WaitlistCTA />
    </PublicLayout>
  );
}
