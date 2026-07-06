"use client";
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeading } from '../components/common/PageHeading'
import { Card } from '../components/ui/Card'
import { getApiBaseUrl } from '../config/apiBase'
import { adminApiFetch } from './api/adminSession'

type PageSummary = {
  id: number
  title: string
  slug: string
  is_published: boolean
  created_at?: string
  updated_at?: string
}

type PageDetails = {
  id: number
  title: string
  slug: string
  content: string
  is_published: boolean
}

type PaginatedResponse<T> = {
  data: T[]
}

type FormState = {
  id?: number
  title: string
  slug: string
  is_published: boolean
  content: string
}

const emptyForm: FormState = {
  title: '',
  slug: '',
  is_published: false,
  content: '',
}

export default function AdminPages() {
  const router = useRouter()
  const apiBaseUrl = getApiBaseUrl()
  const [items, setItems] = useState<PageSummary[] | null>(null)
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
  const canSave = form.title.trim() !== '' && form.content.trim() !== ''

  const loadPages = useCallback(async () => {
    setLoading(true)
    setError(null)
    setStatus(null)
    try {
      const url = new URL(`${apiBaseUrl}/api/admin/pages`)
      url.searchParams.set('per_page', '100')
      if (search.trim() !== '') {
        url.searchParams.set('search', search.trim())
      }
      if (statusFilter !== 'all') {
        url.searchParams.set('status', statusFilter)
      }

      const response = await adminApiFetch(url.toString())
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to load pages')
      }
      const data = (await response.json()) as PaginatedResponse<PageSummary>
      setItems(data.data ?? [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load pages'
      setError(message)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, search, statusFilter])

  useEffect(() => {
    loadPages()
  }, [loadPages])

  const resetForm = () => {
    setForm(emptyForm)
    setPreview(false)
  }

  const loadPageIntoForm = async (id: number) => {
    setSaving(true)
    setError(null)
    setStatus(null)
    try {
      const response = await adminApiFetch(`${apiBaseUrl}/api/admin/pages/${id}`)
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to load page')
      }
      const page = (await response.json()) as PageDetails
      setForm({
        id: page.id,
        title: page.title ?? '',
        slug: page.slug ?? '',
        is_published: !!page.is_published,
        content: page.content ?? '',
      })
      setPreview(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load page'
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
        is_published: form.is_published,
      }

      const url = isEditing ? `${apiBaseUrl}/api/admin/pages/${form.id as number}` : `${apiBaseUrl}/api/admin/pages`
      const response = await adminApiFetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to save page')
      }

      const data = (await response.json().catch(() => null)) as { id?: number } | null
      setStatus(isEditing ? 'Page updated.' : 'Page created.')
      await loadPages()

      if (!isEditing && data && typeof data.id === 'number') {
        await loadPageIntoForm(data.id)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save page'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (page: PageSummary) => {
    if (!window.confirm(`Delete page "${page.title}"?`)) return

    setSaving(true)
    setError(null)
    setStatus(null)
    try {
      const response = await adminApiFetch(`${apiBaseUrl}/api/admin/pages/${page.id}`, { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to delete page')
      }
      if (form.id === page.id) {
        resetForm()
      }
      setStatus('Page deleted.')
      await loadPages()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete page'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePublished = async (page: PageSummary) => {
    setSaving(true)
    setError(null)
    setStatus(null)
    try {
      const nextPublished = !page.is_published
      const response = await adminApiFetch(`${apiBaseUrl}/api/admin/pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: nextPublished }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to update status')
      }

      if (form.id === page.id) {
        setForm((s) => ({ ...s, is_published: nextPublished }))
      }

      setStatus(nextPublished ? 'Page published.' : 'Page moved to draft.')
      await loadPages()
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
      const response = await adminApiFetch(`${apiBaseUrl}/api/admin/pages/generate-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          slug: form.slug.trim() !== '' ? form.slug.trim() : null,
        }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to generate content')
      }
      const data = (await response.json()) as { content?: string }
      setForm((s) => ({ ...s, content: data.content ?? '' }))
      setPreview(false)
      setStatus('Content generated. Review and save the page.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate content'
      setError(message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeading
        title="Pages"
        subtitle="Manage policy pages, About Us, and Contact."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Pages', isCurrent: true },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.open('/privacy-policy', '_blank')}
              className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800/70"
            >
              View site
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800/70"
            >
              New page
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
          title="All pages"
          subtitle="Select a page to edit."
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
                onClick={loadPages}
                className="inline-flex h-9 items-center rounded-lg border border-slate-700 bg-slate-900/70 px-3 text-xs font-medium text-slate-100 hover:bg-slate-800/70"
              >
                Refresh
              </button>
            </div>
          }
        >
          {loading && <p className="text-sm text-slate-400">Loading pages…</p>}
          {!loading && items && items.length === 0 && <p className="text-sm text-slate-400">No pages found.</p>}

          {!loading && items && items.length > 0 && (
            <div className="overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs text-slate-400">
                  <tr className="border-b border-slate-800/80">
                    <th className="py-2 pr-3 font-medium">Title</th>
                    <th className="py-2 pr-3 font-medium">Slug</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 pr-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {items.map((page) => (
                    <tr key={page.id} className="hover:bg-slate-950/30">
                      <td className="py-2 pr-3">
                        <button type="button" onClick={() => loadPageIntoForm(page.id)} className="text-slate-100 hover:text-sky-200">
                          {page.title}
                        </button>
                      </td>
                      <td className="py-2 pr-3 text-slate-300">/{page.slug}</td>
                      <td className="py-2 pr-3 text-slate-300">{page.is_published ? 'Published' : 'Draft'}</td>
                      <td className="py-2 pr-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => loadPageIntoForm(page.id)}
                            disabled={saving}
                            className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-800/70 disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTogglePublished(page)}
                            disabled={saving}
                            className="inline-flex items-center rounded-lg border border-emerald-700/60 bg-emerald-950/20 px-3 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-950/35 disabled:opacity-50"
                          >
                            {page.is_published ? 'Draft' : 'Publish'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(page)}
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

        <Card title={isEditing ? 'Edit page' : 'Create page'} subtitle="HTML content (rich text ready).">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-slate-300">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-sm text-slate-100"
                  placeholder="Page title"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">Slug (optional)</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-sm text-slate-100"
                  placeholder="privacy-policy"
                />
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
              <div className="rounded-lg border border-slate-700 bg-white px-4 py-4 text-slate-900">
                <article className="max-w-none" dangerouslySetInnerHTML={{ __html: form.content }} />
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
