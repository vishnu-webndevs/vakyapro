import type { Metadata } from 'next';
import DeleteAccountPage from '@/src/DeleteAccountPage';

export const metadata: Metadata = {
  title: "Account Deletion | VakyaPro Support",
  description: "Permanently delete your VakyaPro legal AI account and delete all associated user records from our database.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "https://vakyapro.com/delete-account",
  },
};

export default function DeleteAccount() {
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
        "name": "Delete Account",
        "item": "https://vakyapro.com/delete-account"
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <DeleteAccountPage />
    </>
  );
}
