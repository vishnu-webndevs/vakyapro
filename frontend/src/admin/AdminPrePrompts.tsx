import { useEffect, useMemo, useState } from 'react'
import { PageHeading } from '../components/common/PageHeading'
import { Card } from '../components/ui/Card'
import { getApiBaseUrl } from '../config/apiBase'
import { adminApiFetch } from './api/adminSession'

type PrePromptVariant = {
  prompt: string
  image?: string | null
}

type PrePrompt = {
  id: number
  title: string
  category: string
  sort_order: number
  is_active: boolean
  variants: PrePromptVariant[]
  created_at?: string
  updated_at?: string
}

type FormState = {
  id?: number
  title: string
  category: string
  sort_order: string
  is_active: boolean
  variants: PrePromptVariant[]
}

const emptyForm: FormState = {
  title: '',
  category: '',
  sort_order: '0',
  is_active: true,
  variants: [{ prompt: '', image: '' }],
}

export default function AdminPrePrompts() {
  const [items, setItems] = useState<PrePrompt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success')
  const [search, setSearch] = useState('')
  const [includeInactive, setIncludeInactive] = useState(true)
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
        setError(null)

        const params = new URLSearchParams()
        params.set('include_inactive', includeInactive ? 'true' : 'false')
        if (search.trim()) params.set('search', search.trim())

        const response = await adminApiFetch(
          `${apiBaseUrl}/api/admin/pre-prompts?${params.toString()}`,
          { signal: controller.signal },
        )

        if (!response.ok) {
          throw new Error('Failed to load pre-prompts')
        }

        const json = (await response.json()) as { data: PrePrompt[] }
        setItems(json.data ?? [])
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Something went wrong')
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
      category: selectedItem.category ?? '',
      sort_order: String(selectedItem.sort_order ?? 0),
      is_active: Boolean(selectedItem.is_active),
      variants:
        selectedItem.variants && selectedItem.variants.length > 0
          ? selectedItem.variants.map((v) => ({
              prompt: v.prompt ?? '',
              image: v.image ?? '',
            }))
          : [{ prompt: '', image: '' }],
    })
  }, [selectedItem])

  const resetForm = () => {
    setForm(emptyForm)
  }

  const selectItem = (item: PrePrompt) => {
    setNotification(null)
    setError(null)
    setForm({
      id: item.id,
      title: item.title,
      category: item.category,
      sort_order: String(item.sort_order ?? 0),
      is_active: Boolean(item.is_active),
      variants:
        item.variants && item.variants.length > 0
          ? item.variants.map((v) => ({
              prompt: v.prompt ?? '',
              image: v.image ?? '',
            }))
          : [{ prompt: '', image: '' }],
    })
  }

  const updateVariant = (index: number, next: Partial<PrePromptVariant>) => {
    setForm((prev) => {
      const variants = [...prev.variants]
      variants[index] = { ...variants[index], ...next }
      return { ...prev, variants }
    })
  }

  const addVariant = () => {
    setForm((prev) => ({ ...prev, variants: [...prev.variants, { prompt: '', image: '' }] }))
  }

  const removeVariant = (index: number) => {
    setForm((prev) => {
      const variants = prev.variants.filter((_, i) => i !== index)
      return { ...prev, variants: variants.length > 0 ? variants : [{ prompt: '', image: '' }] }
    })
  }

  const save = async () => {
    setNotification(null)
    setError(null)
    setSaving(true)

    try {
      const payload = {
        title: form.title.trim(),
        category: form.category.trim(),
        sort_order: Number.isFinite(Number(form.sort_order)) ? Number(form.sort_order) : 0,
        is_active: form.is_active,
        variants: form.variants.map((v) => ({
          prompt: v.prompt,
          image: v.image ?? null,
        })),
      }

      const isEdit = typeof form.id === 'number'
      const url = isEdit
        ? `${apiBaseUrl}/api/admin/pre-prompts/${form.id}`
        : `${apiBaseUrl}/api/admin/pre-prompts`

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
        throw new Error(firstError || data.message || 'Failed to save pre-prompt.')
      }

      const json = (await response.json()) as { data: PrePrompt }
      const saved = json.data

      setItems((prev) => {
        const idx = prev.findIndex((p) => p.id === saved.id)
        if (idx === -1) return [...prev, saved].sort((a, b) => (a.sort_order - b.sort_order) || (a.id - b.id))
        const next = [...prev]
        next[idx] = saved
        return next.sort((a, b) => (a.sort_order - b.sort_order) || (a.id - b.id))
      })

      setNotification('Saved successfully.')
      setNotificationType('success')
      if (!form.id) {
        selectItem(saved)
      }
    } catch (err) {
      setNotification(err instanceof Error ? err.message : 'Something went wrong')
      setNotificationType('error')
    } finally {
      setSaving(false)
    }
  }

  const deleteItem = async () => {
    if (!form.id) return
    const confirmed = window.confirm('Delete this pre-prompt? This cannot be undone.')
    if (!confirmed) return

    setNotification(null)
    setError(null)
    setDeleting(true)

    try {
      const response = await adminApiFetch(`${apiBaseUrl}/api/admin/pre-prompts/${form.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to delete pre-prompt.')
      }

      setItems((prev) => prev.filter((p) => p.id !== form.id))
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
        title="Pre-prompts"
        subtitle="Manage prompt templates shown in the app's Pre-Prompts screen."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Pre-prompts', isCurrent: true },
        ]}
      />

      {(notification || error) && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs ${
            notificationType === 'success' && notification
              ? 'border-emerald-600/70 bg-emerald-950/40 text-emerald-100'
              : 'border-rose-600/70 bg-rose-950/40 text-rose-100'
          }`}
        >
          {notification || error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card title="Library" subtitle="Search, sort, and pick an item to edit.">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or category..."
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

            {loading && <div className="text-xs text-slate-400">Loading pre-prompts…</div>}
            {!loading && items.length === 0 && (
              <div className="text-xs text-slate-400">No pre-prompts found.</div>
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
                        Order
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
                          <td className="px-4 py-2 text-xs text-slate-300">{item.sort_order}</td>
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

        <Card title={form.id ? 'Edit pre-prompt' : 'Create pre-prompt'} subtitle="Update fields and variants.">
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

            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-xs text-slate-300">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs text-slate-300">Category</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
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

            <div className="rounded-xl border border-slate-800/80 bg-slate-950/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-slate-200">Variants</div>
                <button
                  type="button"
                  onClick={addVariant}
                  className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700/70"
                >
                  Add variant
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {form.variants.map((v, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-800/80 bg-slate-950/30 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold text-slate-300">Variant {idx + 1}</div>
                      <button
                        type="button"
                        onClick={() => removeVariant(idx)}
                        className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700/70"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-2 space-y-2">
                      <label className="block text-xs text-slate-300">Prompt</label>
                      <textarea
                        value={v.prompt}
                        onChange={(e) => updateVariant(idx, { prompt: e.target.value })}
                        rows={4}
                        className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>

                    <div className="mt-2 space-y-2">
                      <label className="block text-xs text-slate-300">Image URL</label>
                      <input
                        value={v.image ?? ''}
                        onChange={(e) => updateVariant(idx, { image: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

