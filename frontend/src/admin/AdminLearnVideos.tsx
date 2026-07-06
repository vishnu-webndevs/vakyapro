import { useEffect, useMemo, useState } from 'react'
import { PageHeading } from '../components/common/PageHeading'
import { Card } from '../components/ui/Card'
import { getApiBaseUrl } from '../config/apiBase'
import { adminApiFetch } from './api/adminSession'

type LearnVideo = {
  id: number
  title: string
  description: string
  category: string
  video_url: string
  thumbnail_url: string | null
  duration: string | null
  sort_order: number
  is_active: boolean
}

type FormState = {
  id?: number
  title: string
  description: string
  category: string
  video_url: string
  thumbnail_url: string
  duration: string
  sort_order: string
  is_active: boolean
}

const emptyForm: FormState = {
  title: '',
  description: '',
  category: '',
  video_url: '',
  thumbnail_url: '',
  duration: '',
  sort_order: '0',
  is_active: true,
}

export default function AdminLearnVideos() {
  const [items, setItems] = useState<LearnVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [includeInactive, setIncludeInactive] = useState(true)
  const [notification, setNotification] = useState<string | null>(null)
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)

  const apiBaseUrl = getApiBaseUrl()
  const selectedId = form.id ?? null
  const selectedItem = useMemo(
    () => (selectedId ? items.find((row) => row.id === selectedId) ?? null : null),
    [items, selectedId],
  )

  useEffect(() => {
    const controller = new AbortController()

    const fetchItems = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        params.set('include_inactive', includeInactive ? 'true' : 'false')
        if (search.trim()) params.set('search', search.trim())

        const response = await adminApiFetch(`${apiBaseUrl}/api/admin/learn?${params.toString()}`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('Failed to load learn videos')
        const json = (await response.json()) as { data: LearnVideo[] }
        const data = Array.isArray(json.data) ? json.data : []
        setItems(data)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setNotification(err instanceof Error ? err.message : 'Something went wrong')
        setNotificationType('error')
      } finally {
        setLoading(false)
      }
    }

    void fetchItems()

    return () => controller.abort()
  }, [apiBaseUrl, includeInactive, search])

  useEffect(() => {
    if (!selectedItem) return
    setForm({
      id: selectedItem.id,
      title: selectedItem.title ?? '',
      description: selectedItem.description ?? '',
      category: selectedItem.category ?? '',
      video_url: selectedItem.video_url ?? '',
      thumbnail_url: selectedItem.thumbnail_url ?? '',
      duration: selectedItem.duration ?? '',
      sort_order: String(selectedItem.sort_order ?? 0),
      is_active: Boolean(selectedItem.is_active),
    })
  }, [selectedItem])

  const resetForm = () => setForm(emptyForm)

  const selectItem = (item: LearnVideo) => {
    setNotification(null)
    setForm({
      id: item.id,
      title: item.title ?? '',
      description: item.description ?? '',
      category: item.category ?? '',
      video_url: item.video_url ?? '',
      thumbnail_url: item.thumbnail_url ?? '',
      duration: item.duration ?? '',
      sort_order: String(item.sort_order ?? 0),
      is_active: Boolean(item.is_active),
    })
  }

  const save = async () => {
    setNotification(null)
    setSaving(true)

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        video_url: form.video_url.trim(),
        thumbnail_url: form.thumbnail_url.trim() ? form.thumbnail_url.trim() : null,
        duration: form.duration.trim() ? form.duration.trim() : null,
        sort_order: Number.isFinite(Number(form.sort_order)) ? Number(form.sort_order) : 0,
        is_active: form.is_active,
      }

      const isEdit = typeof form.id === 'number'
      const url = isEdit ? `${apiBaseUrl}/api/admin/learn/${form.id}` : `${apiBaseUrl}/api/admin/learn`
      const response = await adminApiFetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const firstError =
          data.errors &&
          Object.values<string[]>(data.errors)
            .flat()
            .join(' ')
        throw new Error(firstError || data.message || 'Failed to save learn video.')
      }

      const json = (await response.json()) as { data: LearnVideo }
      const saved = json.data

      setItems((prev) => {
        const idx = prev.findIndex((p) => p.id === saved.id)
        if (idx === -1) return [saved, ...prev]
        const next = [...prev]
        next[idx] = saved
        return next
      })

      setNotification('Saved successfully.')
      setNotificationType('success')
      if (!form.id) selectItem(saved)
    } catch (err) {
      setNotification(err instanceof Error ? err.message : 'Something went wrong')
      setNotificationType('error')
    } finally {
      setSaving(false)
    }
  }

  const deleteItem = async () => {
    if (!form.id) return
    const confirmed = window.confirm('Delete this learn video? This will unpublish it.')
    if (!confirmed) return

    setNotification(null)
    setDeleting(true)

    try {
      const response = await adminApiFetch(`${apiBaseUrl}/api/admin/learn/${form.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to delete learn video.')
      }

      setItems((prev) => prev.filter((row) => row.id !== form.id))
      resetForm()
      setNotification('Deleted.')
      setNotificationType('success')
    } catch (err) {
      setNotification(err instanceof Error ? err.message : 'Something went wrong')
      setNotificationType('error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeading
        title="Learn videos"
        subtitle="Manage Learn section videos shown in the app."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Learn videos', isCurrent: true },
        ]}
      />

      {notification && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs ${
            notificationType === 'success'
              ? 'border-emerald-600/70 bg-emerald-950/40 text-emerald-100'
              : 'border-rose-600/70 bg-rose-950/40 text-rose-100'
          }`}
        >
          {notification}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card title="Library" subtitle="Search and pick a video to edit.">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title/category..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              />
              <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={includeInactive}
                  onChange={(e) => setIncludeInactive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-600 focus:ring-sky-500"
                />
                Show inactive
              </label>
            </div>

            {loading && <div className="text-xs text-slate-400">Loading learn videos…</div>}
            {!loading && items.length === 0 && (
              <div className="text-xs text-slate-400">No videos found.</div>
            )}

            {!loading && items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800 text-sm">
                  <thead className="bg-slate-900/80">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Title
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Category
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Active
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {items.map((item) => {
                      const isSelected = form.id === item.id
                      return (
                        <tr
                          key={item.id}
                          className={`cursor-pointer ${
                            isSelected ? 'bg-sky-950/30' : 'hover:bg-slate-900/70'
                          }`}
                          onClick={() => selectItem(item)}
                        >
                          <td className="px-4 py-2 text-xs text-slate-100">{item.title}</td>
                          <td className="px-4 py-2 text-xs text-slate-200">{item.category}</td>
                          <td className="px-4 py-2 text-xs">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                item.is_active
                                  ? 'bg-emerald-500/15 text-emerald-300'
                                  : 'bg-slate-700/40 text-slate-300'
                              }`}
                            >
                              {item.is_active ? 'Yes' : 'No'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>

        <Card title={form.id ? 'Edit video' : 'Create video'} subtitle="Update fields and publish/unpublish.">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-700/70"
              >
                New
              </button>
              <div className="flex items-center gap-2">
                {form.id && (
                  <button
                    type="button"
                    onClick={() => void deleteItem()}
                    disabled={deleting}
                    className="inline-flex items-center rounded-lg border border-rose-600/70 bg-rose-900/20 px-3 py-2 text-xs font-medium text-rose-100 hover:bg-rose-900/40 disabled:opacity-60"
                  >
                    {deleting ? 'Deleting…' : 'Delete'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void save()}
                  disabled={saving}
                  className="inline-flex items-center rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:from-sky-600 hover:to-indigo-700 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-slate-300">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-slate-300">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-xs text-slate-300">Category</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs text-slate-300">Duration</label>
                <input
                  value={form.duration}
                  onChange={(e) => setForm((prev) => ({ ...prev, duration: e.target.value }))}
                  placeholder="e.g. 3:12"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-slate-300">Video URL</label>
              <input
                value={form.video_url}
                onChange={(e) => setForm((prev) => ({ ...prev, video_url: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-slate-300">Thumbnail URL (optional)</label>
              <input
                value={form.thumbnail_url}
                onChange={(e) => setForm((prev) => ({ ...prev, thumbnail_url: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-xs text-slate-300">Sort order</label>
                <input
                  value={form.sort_order}
                  onChange={(e) => setForm((prev) => ({ ...prev, sort_order: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs text-slate-300">Status</label>
                <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-600 focus:ring-sky-500"
                  />
                  Active
                </label>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

