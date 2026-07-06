import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "VakyaPro - AI-Powered Legal Technology Platform",
  description: "VakyaPro is a professional AI-powered legal technology platform designed for law firms and legal professionals. Create precise legal drafts, streamline document analysis, and leverage smart AI prompt engineering for legal workflows.",
  keywords: "VakyaPro, legal AI, legal technology platform, legal prompt engineering, legal AI drafting, smart legal assistant",
  icons: {
    icon: "/Vakya-pro.png",
  },
  openGraph: {
    title: "VakyaPro - AI-Powered Legal Technology Platform",
    description: "VakyaPro is a professional AI-powered legal technology platform designed for law firms and legal professionals.",
    type: "website",
    url: "https://vakyapro.com",
    images: ["/Vakya-pro.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "VakyaPro - AI-Powered Legal Technology Platform",
    description: "VakyaPro is a professional AI-powered legal technology platform designed for law firms and legal professionals.",
    images: ["/Vakya-pro.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "VakyaPro",
    "url": "https://vakyapro.com",
    "logo": "https://vakyapro.com/Vakya-pro.png",
    "description": "VakyaPro is a professional AI-powered legal technology platform designed for law firms and legal professionals.",
    "sameAs": [
      "https://twitter.com/vakyapro"
    ]
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "VakyaPro",
    "url": "https://vakyapro.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://vakyapro.com/blog?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "VakyaPro",
    "operatingSystem": "All",
    "applicationCategory": "BusinessApplication",
    "description": "Enterprise AI-powered legal technology platform for legal drafting and document intelligence.",
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD"
    }
  };

  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white overflow-x-hidden">
        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){if(w.location&&w.location.pathname&&w.location.pathname.startsWith('/admin'))return;w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-MMG6XVQJ');`,
          }}
        />
        {/* End Google Tag Manager */}

        {/* Global Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />

        {children}
      </body>
    </html>
  );
}
