'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { getApiBaseUrl } from '../config/apiBase'
import { useMeta } from '../hooks/useMeta'

type Category = {
  id: number
  name: string
  slug: string
  published_blogs_count?: number
}

type BlogItem = {
  id: number
  title: string
  slug: string
  excerpt?: string
  featured_image?: string | null
  created_at?: string
  category?: {
    id: number
    name: string
    slug: string
  } | null
}

type Paginated<T> = {
  data: T[]
  current_page: number
  last_page: number
}

type CategoryBlogsResponse = {
  category: Category
  blogs: Paginated<BlogItem>
}

function formatDate(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function BlogIndex() {
  const apiBaseUrl = getApiBaseUrl()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [blogs, setBlogs] = useState<Paginated<BlogItem> | null>(null)
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [latest, setLatest] = useState<BlogItem[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useMeta({
    title: 'VakyaPro · Blog',
    description: 'Guides, tips, and updates about prompts and productivity.',
    ogTitle: 'VakyaPro Blog',
    ogDescription: 'Guides, tips, and updates about prompts and productivity.',
    twitterTitle: 'VakyaPro Blog',
    twitterDescription: 'Guides, tips, and updates about prompts and productivity.',
  })

  const page = useMemo(() => {
    const n = Number(searchParams?.get('page') ?? '1')
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1
  }, [searchParams])

  const categorySlug = useMemo(() => {
    const raw = (searchParams?.get('category') ?? '').trim()
    return raw !== '' ? raw : null
  }, [searchParams])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const load = async () => {
      try {
        const perPage = 10

        const blogsUrl = categorySlug
          ? `${apiBaseUrl}/api/categories/${encodeURIComponent(categorySlug)}/blogs?per_page=${perPage}&page=${page}`
          : `${apiBaseUrl}/api/blogs?per_page=${perPage}&page=${page}`

        const [blogsResponse, categoriesResponse, latestResponse] = await Promise.all([
          fetch(blogsUrl, { headers: { Accept: 'application/json' } }),
          fetch(`${apiBaseUrl}/api/categories`, { headers: { Accept: 'application/json' } }),
          fetch(`${apiBaseUrl}/api/blogs?per_page=7&page=1`, { headers: { Accept: 'application/json' } }),
        ])

        if (!blogsResponse.ok) {
          const data = await blogsResponse.json().catch(() => ({}))
          throw new Error(data.message || 'Failed to load blogs')
        }
        if (!categoriesResponse.ok) {
          const data = await categoriesResponse.json().catch(() => ({}))
          throw new Error(data.message || 'Failed to load categories')
        }
        if (!latestResponse.ok) {
          const data = await latestResponse.json().catch(() => ({}))
          throw new Error(data.message || 'Failed to load latest posts')
        }

        const blogsData = categorySlug
          ? ((await blogsResponse.json()) as CategoryBlogsResponse).blogs
          : ((await blogsResponse.json()) as Paginated<BlogItem>)

        const categoryData = (await categoriesResponse.json()) as Category[]
        const latestData = (await latestResponse.json()) as Paginated<BlogItem>

        if (cancelled) return
        setBlogs(blogsData)
        setCategories(categoryData)
        setLatest(latestData.data ?? [])
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Failed to load blog'
        setError(message)
        setBlogs({ data: [], current_page: 1, last_page: 1 })
        setCategories([])
        setLatest([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [apiBaseUrl, categorySlug, page])

  const setCategory = (slug: string | null) => {
    const next = new URLSearchParams(searchParams?.toString() ?? '')
    if (slug) {
      next.set('category', slug)
    } else {
      next.delete('category')
    }
    next.delete('page')
    router.push(`/blog?${next.toString()}`)
  }

  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams?.toString() ?? '')
    next.set('page', String(nextPage))
    router.push(`/blog?${next.toString()}`)
  }

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex-1">
            <header className="mb-6">
              <h1 className="text-3xl sm:text-4xl font-bold">Blog</h1>
              <p className="mt-2 text-gray-400">Guides, tips, and updates about prompts and productivity.</p>
              {categorySlug && (
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-300">
                  <span>Category:</span>
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                    {categorySlug}
                  </span>
                  <button type="button" onClick={() => setCategory(null)} className="text-cyan-300 hover:text-cyan-200">
                    Clear
                  </button>
                </div>
              )}
            </header>

            {error && <div className="mb-4 rounded-xl border border-rose-600/60 bg-rose-950/30 px-4 py-3 text-sm text-rose-100">{error}</div>}
            {loading && <p className="text-gray-400">Loading…</p>}

            {!loading && blogs && blogs.data.length === 0 && <p className="text-gray-400">No posts found.</p>}

            {!loading && blogs && blogs.data.length > 0 && (
              <div className="space-y-4">
                {blogs.data.map((blog) => (
                  <article
                    key={blog.id}
                    className="rounded-2xl border border-gray-800 bg-black/40 backdrop-blur-xl overflow-hidden"
                  >
                    {blog.featured_image && (
                      <Link href={`/blog/${blog.slug}`} className="block">
                        <img src={blog.featured_image} alt={blog.title} className="h-48 w-full object-cover" loading="lazy" />
                      </Link>
                    )}
                    <div className="p-5">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                        {blog.category && (
                          <button
                            type="button"
                            onClick={() => setCategory(blog.category?.slug ?? null)}
                            className="rounded-full border border-gray-800 bg-gray-900/40 px-3 py-1 text-gray-300 hover:border-cyan-500/30 hover:text-cyan-200"
                          >
                            {blog.category.name}
                          </button>
                        )}
                        {blog.created_at && <span>{formatDate(blog.created_at)}</span>}
                      </div>
                      <h2 className="mt-2 text-xl font-semibold">
                        <Link href={`/blog/${blog.slug}`} className="hover:text-cyan-300">
                          {blog.title}
                        </Link>
                      </h2>
                      {blog.excerpt && <p className="mt-2 text-gray-400 leading-relaxed">{blog.excerpt}</p>}
                      <div className="mt-4">
                        <Link href={`/blog/${blog.slug}`} className="text-sm text-cyan-300 hover:text-cyan-200">
                          Read more →
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setPage(Math.max(1, blogs.current_page - 1))}
                    disabled={blogs.current_page <= 1}
                    className="rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-2 text-sm text-gray-200 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <div className="text-sm text-gray-400">
                    Page {blogs.current_page} of {blogs.last_page}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPage(Math.min(blogs.last_page, blogs.current_page + 1))}
                    disabled={blogs.current_page >= blogs.last_page}
                    className="rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-2 text-sm text-gray-200 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          <aside className="w-full lg:w-80 space-y-6">
            <section className="rounded-2xl border border-gray-800 bg-black/40 backdrop-blur-xl p-5">
              <h2 className="text-lg font-semibold">Categories</h2>
              {!categories && <p className="mt-2 text-gray-400 text-sm">Loading…</p>}
              {categories && categories.length === 0 && <p className="mt-2 text-gray-400 text-sm">No categories.</p>}
              {categories && categories.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <button
                        type="button"
                        onClick={() => setCategory(cat.slug)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          cat.slug === categorySlug ? 'bg-cyan-500/10 text-cyan-100' : 'hover:bg-gray-900/40 text-gray-200'
                        }`}
                      >
                        <span>{cat.name}</span>
                        <span className="text-xs text-gray-400">{typeof cat.published_blogs_count === 'number' ? cat.published_blogs_count : ''}</span>
                      </button>
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
                  {latest.map((post) => (
                    <li key={post.id} className="text-sm">
                      <Link href={`/blog/${post.slug}`} className="text-gray-200 hover:text-cyan-300">
                        {post.title}
                      </Link>
                      {post.created_at && <div className="mt-0.5 text-xs text-gray-500">{formatDate(post.created_at)}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-gray-800 bg-black/40 backdrop-blur-xl p-5">
              <h2 className="text-lg font-semibold">Try the app</h2>
              <p className="mt-2 text-sm text-gray-400">Turn your idea into a polished prompt in minutes.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/#pricing"
                  className="inline-flex items-center rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  View pricing
                </Link>
                <Link href="/" className="inline-flex items-center rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-2 text-sm text-gray-200">
                  Home
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
