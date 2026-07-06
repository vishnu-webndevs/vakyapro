"use client";
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeading } from '../components/common/PageHeading'
import { Card } from '../components/ui/Card'
import { getApiBaseUrl } from '../config/apiBase'
import { adminApiFetch } from './api/adminSession'

type Category = {
  id: number
  name: string
  slug: string
}

type BlogSummary = {
  id: number
  title: string
  slug: string
  excerpt?: string
  featured_image?: string | null
  is_published: boolean
  created_at?: string
  updated_at?: string
  category?: Category | null
}

type BlogDetails = {
  id: number
  title: string
  slug: string
  content: string
  category_id: number
  featured_image?: string | null
  is_published: boolean
}

type PaginatedResponse<T> = {
  data: T[]
}

type FormState = {
  id?: number
  title: string
  slug: string
  category_id: string
  featured_image: string
  is_published: boolean
  content: string
}

const emptyForm: FormState = {
  title: '',
  slug: '',
  category_id: '',
  featured_image: '',
  is_published: false,
  content: '',
}

export default function AdminBlogs() {
  const router = useRouter()
  const apiBaseUrl = getApiBaseUrl()
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [items, setItems] = useState<BlogSummary[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [preview, setPreview] = useState(false)

  const isEditing = useMemo(() => typeof form.id === 'number', [form.id])

  const loadCategories = useCallback(async () => {
    try {
      const url = new URL(`${apiBaseUrl}/api/admin/blog-categories`)
      url.searchParams.set('per_page', '100')
      const response = await adminApiFetch(url.toString())
      if (!response.ok) {
        return
      }
      const data = (await response.json()) as PaginatedResponse<Category>
      setCategories(data.data ?? [])
    } catch {
      setCategories([])
    }
  }, [apiBaseUrl])

  const loadBlogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    setStatus(null)
    try {
      const url = new URL(`${apiBaseUrl}/api/admin/blogs`)
      url.searchParams.set('per_page', '50')
      if (search.trim() !== '') {
        url.searchParams.set('search', search.trim())
      }
      if (statusFilter !== 'all') {
        url.searchParams.set('status', statusFilter)
      }

      const response = await adminApiFetch(url.toString())
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to load blogs')
      }

      const data = (await response.json()) as PaginatedResponse<BlogSummary>
      setItems(data.data ?? [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load blogs'
      setError(message)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, search, statusFilter])

  useEffect(() => {
    loadCategories()
    loadBlogs()
  }, [loadBlogs, loadCategories])

  const resetForm = () => {
    setForm(emptyForm)
    setPreview(false)
  }

  const loadBlogIntoForm = async (id: number) => {
    setSaving(true)
    setError(null)
    setStatus(null)
    try {
      const response = await adminApiFetch(`${apiBaseUrl}/api/admin/blogs/${id}`)
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to load blog')
      }
      const blog = (await response.json()) as BlogDetails
      setForm({
        id: blog.id,
        title: blog.title ?? '',
        slug: blog.slug ?? '',
        category_id: String(blog.category_id ?? ''),
        featured_image: blog.featured_image ?? '',
        is_published: !!blog.is_published,
        content: blog.content ?? '',
      })
      setPreview(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load blog'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setStatus(null)
    try {
      const payload = {
        title: form.title,
        slug: form.slug.trim() !== '' ? form.slug.trim() : null,
        content: form.content,
        category_id: Number(form.category_id),
        featured_image: form.featured_image.trim() !== '' ? form.featured_image.trim() : null,
        is_published: form.is_published,
      }

      const url = isEditing ? `${apiBaseUrl}/api/admin/blogs/${form.id as number}` : `${apiBaseUrl}/api/admin/blogs`
      const response = await adminApiFetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to save blog')
      }

      const data = (await response.json().catch(() => null)) as { id?: number } | null
      setStatus(isEditing ? 'Blog updated.' : 'Blog created.')
      await loadBlogs()

      if (!isEditing && data && typeof data.id === 'number') {
        await loadBlogIntoForm(data.id)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save blog'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (blog: BlogSummary) => {
    if (!window.confirm(`Delete blog "${blog.title}"?`)) return

    setSaving(true)
    setError(null)
    setStatus(null)
    try {
      const response = await adminApiFetch(`${apiBaseUrl}/api/admin/blogs/${blog.id}`, { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to delete blog')
      }
      if (form.id === blog.id) {
        resetForm()
      }
      setStatus('Blog deleted.')
      await loadBlogs()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete blog'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePublished = async (blog: BlogSummary) => {
    setSaving(true)
    setError(null)
    setStatus(null)
    try {
      const nextPublished = !blog.is_published
      const response = await adminApiFetch(`${apiBaseUrl}/api/admin/blogs/${blog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: nextPublished }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to update status')
      }

      if (form.id === blog.id) {
        setForm((s) => ({ ...s, is_published: nextPublished }))
      }

      setStatus(nextPublished ? 'Blog published.' : 'Blog moved to draft.')
      await loadBlogs()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update status'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleGenerate = async () => {
    if (form.title.trim() === '') {
      setError('Enter a title first.')
      return
    }

    setGenerating(true)
    setError(null)
    setStatus(null)
    try {
      const response = await adminApiFetch(`${apiBaseUrl}/api/admin/blogs/generate-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title.trim() }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to generate content')
      }
      const data = (await response.json()) as { content?: string }
      setForm((s) => ({ ...s, content: data.content ?? '' }))
      setPreview(false)
      setStatus('Content generated. Review and save the blog.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate content'
      setError(message)
    } finally {
      setGenerating(false)
    }
  }

  const canSave = form.title.trim() !== '' && form.content.trim() !== '' && form.category_id.trim() !== ''

  return (
    <div className="space-y-4">
      <PageHeading
        title="Blogs"
        subtitle="Create and publish SEO-ready blog posts."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Blogs', isCurrent: true },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.push('/admin/blog-categories')}
              className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800/70"
            >
              Categories
            </button>
            <button
              type="button"
              onClick={() => window.open('/blog', '_blank')}
              className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800/70"
            >
              View blog
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800/70"
            >
              New blog
            </button>
          </div>
        }
      />

      {error && (
        <div className="rounded-xl border border-rose-600/60 bg-rose-950/30 px-4 py-3 text-xs text-rose-100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{error}</span>
            {error.toLowerCase().includes('cannot be decrypted') && (
              <button
                type="button"
                onClick={() => router.push('/admin/settings')}
                className="inline-flex items-center rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-1.5 text-[11px] font-semibold text-rose-100 hover:bg-rose-950/60"
              >
                Open Settings
              </button>
            )}
          </div>
        </div>
      )}
      {status && (
        <div className="rounded-xl border border-emerald-600/60 bg-emerald-950/30 px-4 py-3 text-xs text-emerald-100">
          {status}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr,1fr]">
        <Card
          title="Posts"
          subtitle="Select a post to edit."
          headerRight={
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="h-9 w-48 rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-sm text-slate-100 placeholder:text-slate-500"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft')}
                className="h-9 rounded-lg border border-slate-700 bg-slate-950/60 px-2 text-sm text-slate-100"
              >
                <option value="all">All</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              <button
                type="button"
                onClick={loadBlogs}
                className="inline-flex h-9 items-center rounded-lg border border-slate-700 bg-slate-900/70 px-3 text-xs font-medium text-slate-100 hover:bg-slate-800/70"
              >
                Refresh
              </button>
            </div>
          }
        >
          {loading && <p className="text-sm text-slate-400">Loading blogs…</p>}
          {!loading && items && items.length === 0 && <p className="text-sm text-slate-400">No blogs found.</p>}

          {!loading && items && items.length > 0 && (
            <div className="overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs text-slate-400">
                  <tr className="border-b border-slate-800/80">
                    <th className="py-2 pr-3 font-medium">Title</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 pr-3 font-medium">Category</th>
                    <th className="py-2 pr-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {items.map((blog) => (
                    <tr key={blog.id} className="hover:bg-slate-950/30">
                      <td className="py-2 pr-3">
                        <button type="button" onClick={() => loadBlogIntoForm(blog.id)} className="text-slate-100 hover:text-sky-200">
                          {blog.title}
                        </button>
                        <div className="mt-0.5 text-xs text-slate-500">/{blog.slug}</div>
                      </td>
                      <td className="py-2 pr-3 text-slate-300">{blog.is_published ? 'Published' : 'Draft'}</td>
                      <td className="py-2 pr-3 text-slate-300">{blog.category?.name ?? '—'}</td>
                      <td className="py-2 pr-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => loadBlogIntoForm(blog.id)}
                            disabled={saving}
                            className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-800/70 disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTogglePublished(blog)}
                            disabled={saving}
                            className="inline-flex items-center rounded-lg border border-emerald-700/60 bg-emerald-950/20 px-3 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-950/35 disabled:opacity-50"
                          >
                            {blog.is_published ? 'Draft' : 'Publish'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(blog)}
                            disabled={saving}
                            className="inline-flex items-center rounded-lg border border-rose-700/60 bg-rose-950/30 px-3 py-1.5 text-xs font-medium text-rose-100 hover:bg-rose-950/50 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title={isEditing ? 'Edit post' : 'Create post'} subtitle="Use AI generation, then review and publish.">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-slate-300">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-sm text-slate-100"
                  placeholder="Blog title"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">Slug (optional)</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-sm text-slate-100"
                  placeholder="auto-generated if empty"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-slate-300">Category</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm((s) => ({ ...s, category_id: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-sm text-slate-100"
                >
                  <option value="">Select category…</option>
                  {(categories ?? []).map((category) => (
                    <option key={category.id} value={String(category.id)}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">Featured image URL (optional)</label>
                <input
                  value={form.featured_image}
                  onChange={(e) => setForm((s) => ({ ...s, featured_image: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-sm text-slate-100"
                  placeholder="https://…"
                />
                {form.featured_image.trim() !== '' && (
                  <div className="mt-2 overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/30">
                    <img src={form.featured_image} alt={form.title || 'Featured'} className="h-28 w-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => setForm((s) => ({ ...s, is_published: e.target.checked }))}
                  className="h-4 w-4 rounded border border-slate-700 bg-slate-950/60"
                />
                Published
              </label>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || form.title.trim() === ''}
                className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800/70 disabled:opacity-50"
              >
                {generating ? 'Generating…' : 'Generate Content with AI'}
              </button>

              <button
                type="button"
                onClick={() => setPreview((p) => !p)}
                className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800/70"
              >
                {preview ? 'Edit HTML' : 'Preview'}
              </button>
            </div>

            {!preview && (
              <div className="space-y-1">
                <label className="text-xs text-slate-300">Content (HTML)</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((s) => ({ ...s, content: e.target.value }))}
                  className="min-h-[320px] w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 font-mono text-xs text-slate-100"
                  placeholder="<h1>…</h1>"
                />
              </div>
            )}

            {preview && (
              <div className="space-y-2">
                <div className="rounded-lg border border-slate-700 bg-white px-4 py-4 text-slate-900">
                  <article className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: form.content }} />
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !canSave}
                className="inline-flex items-center rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-900/40 hover:from-sky-400 hover:to-indigo-400 disabled:opacity-50"
              >
                {saving ? 'Saving…' : isEditing ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800/70"
              >
                Clear
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
