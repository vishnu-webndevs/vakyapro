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
  blogs_count?: number
  created_at?: string
  updated_at?: string
}

type PaginatedResponse<T> = {
  data: T[]
  current_page?: number
  last_page?: number
}

type FormState = {
  id?: number
  name: string
  slug: string
}

const emptyForm: FormState = {
  name: '',
  slug: '',
}

export default function AdminBlogCategories() {
  const router = useRouter()
  const apiBaseUrl = getApiBaseUrl()
  const [items, setItems] = useState<Category[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  const isEditing = useMemo(() => typeof form.id === 'number', [form.id])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setStatus(null)
    try {
      const url = new URL(`${apiBaseUrl}/api/admin/blog-categories`)
      url.searchParams.set('per_page', '100')
      if (search.trim() !== '') {
        url.searchParams.set('search', search.trim())
      }

      const response = await adminApiFetch(url.toString())
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to load categories')
      }
      const data = (await response.json()) as PaginatedResponse<Category>
      setItems(data.data ?? [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load categories'
      setError(message)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, search])

  useEffect(() => {
    load()
  }, [load])

  const resetForm = () => {
    setForm(emptyForm)
  }

  const pickForEdit = (category: Category) => {
    setStatus(null)
    setError(null)
    setForm({
      id: category.id,
      name: category.name ?? '',
      slug: category.slug ?? '',
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setStatus(null)
    try {
      const payload = {
        name: form.name,
        slug: form.slug.trim() !== '' ? form.slug.trim() : null,
      }

      const url = isEditing
        ? `${apiBaseUrl}/api/admin/blog-categories/${form.id as number}`
        : `${apiBaseUrl}/api/admin/blog-categories`

      const response = await adminApiFetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to save category')
      }

      setStatus(isEditing ? 'Category updated.' : 'Category created.')
      resetForm()
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save category'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`Delete category "${category.name}"?`)) return

    setSaving(true)
    setError(null)
    setStatus(null)
    try {
      const response = await adminApiFetch(`${apiBaseUrl}/api/admin/blog-categories/${category.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to delete category')
      }

      if (form.id === category.id) {
        resetForm()
      }

      setStatus('Category deleted.')
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete category'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeading
        title="Blog Categories"
        subtitle="Create, edit, and organize blog categories."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Blog Categories', isCurrent: true },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.push('/admin/blogs')}
              className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800/70"
            >
              Manage blogs
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800/70"
            >
              New category
            </button>
          </div>
        }
      />

      {error && <div className="rounded-xl border border-rose-600/60 bg-rose-950/30 px-4 py-3 text-xs text-rose-100">{error}</div>}
      {status && (
        <div className="rounded-xl border border-emerald-600/60 bg-emerald-950/30 px-4 py-3 text-xs text-emerald-100">
          {status}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <Card
          title="Categories"
          subtitle="Click a category to edit."
          headerRight={
            <div className="flex items-center gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="h-9 w-56 rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-sm text-slate-100 placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={load}
                className="inline-flex h-9 items-center rounded-lg border border-slate-700 bg-slate-900/70 px-3 text-xs font-medium text-slate-100 hover:bg-slate-800/70"
              >
                Refresh
              </button>
            </div>
          }
        >
          {loading && <p className="text-sm text-slate-400">Loading categories…</p>}
          {!loading && items && items.length === 0 && <p className="text-sm text-slate-400">No categories found.</p>}

          {!loading && items && items.length > 0 && (
            <div className="overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs text-slate-400">
                  <tr className="border-b border-slate-800/80">
                    <th className="py-2 pr-3 font-medium">Name</th>
                    <th className="py-2 pr-3 font-medium">Slug</th>
                    <th className="py-2 pr-3 font-medium">Blogs</th>
                    <th className="py-2 pr-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {items.map((category) => (
                    <tr key={category.id} className="hover:bg-slate-950/30">
                      <td className="py-2 pr-3">
                        <button type="button" onClick={() => pickForEdit(category)} className="text-slate-100 hover:text-sky-200">
                          {category.name}
                        </button>
                      </td>
                      <td className="py-2 pr-3 text-slate-300">{category.slug}</td>
                      <td className="py-2 pr-3 text-slate-300">{typeof category.blogs_count === 'number' ? category.blogs_count : '—'}</td>
                      <td className="py-2 pr-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(category)}
                          disabled={saving}
                          className="inline-flex items-center rounded-lg border border-rose-700/60 bg-rose-950/30 px-3 py-1.5 text-xs font-medium text-rose-100 hover:bg-rose-950/50 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title={isEditing ? 'Edit category' : 'Create category'} subtitle="Slug auto-generates if empty.">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-sm text-slate-100"
                placeholder="Category name"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300">Slug (optional)</label>
              <input
                value={form.slug}
                onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))}
                className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-sm text-slate-100"
                placeholder="e.g. prompt-engineering"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || form.name.trim() === ''}
                className="inline-flex items-center rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-900/40 hover:from-sky-400 hover:to-indigo-400 disabled:opacity-50"
              >
                {saving ? 'Saving…' : isEditing ? 'Update' : 'Create'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800/70"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

