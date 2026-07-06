'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { getApiBaseUrl } from '../config/apiBase'
import { useMeta } from '../hooks/useMeta'

type Category = {
  id: number
  name: string
  slug: string
}

type BlogDetails = {
  id: number
  title: string
  slug: string
  content: string
  featured_image?: string | null
  created_at?: string
  category?: Category | null
}

type BlogItem = {
  id: number
  title: string
  slug: string
  created_at?: string
}

type Paginated<T> = {
  data: T[]
}

function formatDate(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function BlogPost() {
  const params = useParams()
  const slug = params?.slug as string
  const apiBaseUrl = getApiBaseUrl()
  const [post, setPost] = useState<BlogDetails | null>(null)
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [latest, setLatest] = useState<BlogItem[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useMeta({
    title: post ? `VakyaPro · ${post.title}` : 'VakyaPro · Blog',
    description: post ? `Read ${post.title} on VakyaPro Blog` : 'Guides, tips, and updates about prompts and productivity.',
    ogTitle: post ? post.title : 'VakyaPro Blog',
    ogDescription: post ? `Read ${post.title} on VakyaPro Blog` : 'Guides, tips, and updates about prompts and productivity.',
    ogImage: post?.featured_image || undefined,
    twitterTitle: post ? post.title : 'VakyaPro Blog',
    twitterDescription: post ? `Read ${post.title} on VakyaPro Blog` : 'Guides, tips, and updates about prompts and productivity.',
    twitterImage: post?.featured_image || undefined,
  })

  useEffect(() => {
    setLoading(true)
    setError(null)
    setPost(null)

    let cancelled = false

    const load = async () => {
      try {
        if (!slug) throw new Error('Missing blog slug')

        const [postRes, categoriesRes, latestRes] = await Promise.all([
          fetch(`${apiBaseUrl}/api/blogs/${encodeURIComponent(slug)}`, { headers: { Accept: 'application/json' } }),
          fetch(`${apiBaseUrl}/api/categories`, { headers: { Accept: 'application/json' } }),
          fetch(`${apiBaseUrl}/api/blogs?per_page=7&page=1`, { headers: { Accept: 'application/json' } }),
        ])

        if (!postRes.ok) {
          const data = await postRes.json().catch(() => ({}))
          throw new Error(data.message || 'Blog not found')
        }
        if (!categoriesRes.ok) {
          const data = await categoriesRes.json().catch(() => ({}))
          throw new Error(data.message || 'Failed to load categories')
        }
        if (!latestRes.ok) {
          const data = await latestRes.json().catch(() => ({}))
          throw new Error(data.message || 'Failed to load latest posts')
        }

        const postData = (await postRes.json()) as BlogDetails
        const categoriesData = (await categoriesRes.json()) as Category[]
        const latestData = (await latestRes.json()) as Paginated<BlogItem>

        if (cancelled) return
        setPost(postData)
        setCategories(categoriesData)
        setLatest(latestData.data ?? [])
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Failed to load blog'
        setError(message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [apiBaseUrl, slug])

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading && <p className="text-gray-400">Loading…</p>}
        {error && <div className="rounded-xl border border-rose-600/60 bg-rose-950/30 px-4 py-3 text-sm text-rose-100">{error}</div>}

        {post && (
          <div className="flex flex-col gap-8 lg:flex-row">
            <article className="flex-1">
              <header className="mb-6">
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                  {post.category && (
                    <Link
                      href={`/blog?category=${encodeURIComponent(post.category.slug)}`}
                      className="rounded-full border border-gray-800 bg-gray-900/40 px-3 py-1 text-gray-300 hover:border-cyan-500/30 hover:text-cyan-200"
                    >
                      {post.category.name}
                    </Link>
                  )}
                  {post.created_at && <span>{formatDate(post.created_at)}</span>}
                </div>
                <h1 className="mt-3 text-3xl sm:text-4xl font-bold leading-tight">{post.title}</h1>
              </header>

              {post.featured_image && (
                <div className="mb-6 overflow-hidden rounded-2xl border border-gray-800 bg-black/40">
                  <img src={post.featured_image} alt={post.title} className="w-full object-cover" />
                </div>
              )}

              <div className="rounded-2xl border border-gray-800 bg-black/40 backdrop-blur-xl p-5 sm:p-7">
                <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/blog" className="text-sm text-cyan-300 hover:text-cyan-200">
                  ← Back to blog
                </Link>
                <Link href="/#pricing" className="text-sm text-gray-300 hover:text-cyan-200">
                  View pricing
                </Link>
              </div>
            </article>

            <aside className="w-full lg:w-80 space-y-6">
              <section className="rounded-2xl border border-gray-800 bg-black/40 backdrop-blur-xl p-5">
                <h2 className="text-lg font-semibold">Categories</h2>
                {!categories && <p className="mt-2 text-gray-400 text-sm">Loading…</p>}
                {categories && categories.length === 0 && <p className="mt-2 text-gray-400 text-sm">No categories.</p>}
                {categories && categories.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {categories.map((cat) => (
                      <li key={cat.id}>
                        <Link href={`/blog?category=${encodeURIComponent(cat.slug)}`} className="block rounded-lg px-3 py-2 text-sm text-gray-200 hover:bg-gray-900/40">
                          {cat.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-2xl border border-gray-800 bg-black/40 backdrop-blur-xl p-5">
                <h2 className="text-lg font-semibold">Latest posts</h2>
                {!latest && <p className="mt-2 text-gray-400 text-sm">Loading…</p>}
                {latest && latest.length === 0 && <p className="mt-2 text-gray-400 text-sm">No posts.</p>}
                {latest && latest.length > 0 && (
                  <ul className="mt-3 space-y-3">
                    {latest.map((p) => (
                      <li key={p.id} className="text-sm">
                        <Link href={`/blog/${p.slug}`} className="text-gray-200 hover:text-cyan-300">
                          {p.title}
                        </Link>
                        {p.created_at && <div className="mt-0.5 text-xs text-gray-500">{formatDate(p.created_at)}</div>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-2xl border border-gray-800 bg-black/40 backdrop-blur-xl p-5">
                <h2 className="text-lg font-semibold">Internal links</h2>
                <p className="mt-2 text-sm text-gray-400">Explore the app and learn more.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href="/" className="inline-flex items-center rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-2 text-sm text-gray-200">
                    Home
                  </Link>
                  <Link
                    href="/#features"
                    className="inline-flex items-center rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Features
                  </Link>
                </div>
              </section>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
