import type { Metadata } from 'next';
import BlogPost from '@/src/pages/BlogPost';
import PublicLayout from '@/src/components/PublicLayout';
import { getApiBaseUrl } from '@/src/config/apiBase';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const apiBaseUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${apiBaseUrl}/api/blogs?per_page=100`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      const blogs = json.data || [];
      if (blogs.length > 0) {
        return blogs.map((blog: { slug: string }) => ({
          slug: blog.slug,
        }));
      }
    }
  } catch (e) {
    console.error('Error in generateStaticParams for blog:', e);
  }
  return [{ slug: 'placeholder' }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const apiBaseUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${apiBaseUrl}/api/blogs/${encodeURIComponent(slug)}`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const post = await res.json();
      return {
        title: post.title ? `VakyaPro · ${post.title}` : 'VakyaPro Legal AI Blog',
        description: post.excerpt || `Read ${post.title} on the VakyaPro Legal AI platform blog.`,
        alternates: {
          canonical: `https://vakyapro.com/blog/${slug}`,
        },
        openGraph: {
          title: post.title,
          description: post.excerpt,
          url: `https://vakyapro.com/blog/${slug}`,
          type: "article",
          images: post.featured_image ? [post.featured_image] : ["/Vakya-pro.png"],
        },
        twitter: {
          card: "summary_large_image",
          title: post.title,
          description: post.excerpt,
          images: post.featured_image ? [post.featured_image] : ["/Vakya-pro.png"],
        },
      };
    }
  } catch (e) {
    console.error('Error fetching blog metadata', e);
  }

  return {
    title: 'VakyaPro Legal AI Blog Article',
    description: 'Read the latest legal AI article on the VakyaPro blog.',
    alternates: {
      canonical: `https://vakyapro.com/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const apiBaseUrl = getApiBaseUrl();
  let postData: { title?: string; excerpt?: string; featured_image?: string; created_at?: string } | null = null;

  try {
    const res = await fetch(`${apiBaseUrl}/api/blogs/${encodeURIComponent(slug)}`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      postData = await res.json();
    }
  } catch (e) {
    console.error('Error fetching blog post content for schema', e);
  }

  const blogPostSchema = postData
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": postData.title || "Blog Article",
        "image": postData.featured_image || "https://vakyapro.com/Vakya-pro.png",
        "datePublished": postData.created_at || new Date().toISOString(),
        "description": postData.excerpt || "Legal AI insights on VakyaPro blog.",
        "author": {
          "@type": "Organization",
          "name": "VakyaPro"
        },
        "publisher": {
          "@type": "Organization",
          "name": "VakyaPro",
          "logo": {
            "@type": "ImageObject",
            "url": "https://vakyapro.com/Vakya-pro.png"
          }
        }
      }
    : null;

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
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": postData?.title || "Article",
        "item": `https://vakyapro.com/blog/${slug}`
      }
    ]
  };

  return (
    <PublicLayout>
      {blogPostSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <BlogPost />
    </PublicLayout>
  );
}
