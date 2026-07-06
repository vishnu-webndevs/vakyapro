import { useEffect, useMemo, useState } from 'react'
import { PageHeading } from '../components/common/PageHeading'
import { Card } from '../components/ui/Card'
import { getApiBaseUrl } from '../config/apiBase'
import { adminApiFetch } from './api/adminSession'

type Reel = {
  id: number
  title: string
  description: string | null
  prompt: string | null
  video_url: string | null
  video_path: string | null
  thumbnail_url: string | null
  is_active: boolean
  order: number
  views_count: number
  likes_count: number
  saves_count: number
  shares_count?: number
  comments_count: number
  created_at?: string
}

type ReelComment = {
  id: number
  reel_id: number
  user_id: number
  body: string
  is_visible: boolean
  created_at: string
  user_name: string
  user_email: string
  user_avatar: string | null
  user_is_blocked: boolean
}

type FormState = {
  id?: number
  title: string
  description: string
  prompt: string
  video_url: string
  thumbnail_url: string
  order: string
  is_active: boolean
  video_file: File | null
}

const emptyForm: FormState = {
  title: '',
  description: '',
  prompt: '',
  video_url: '',
  thumbnail_url: '',
  order: '0',
  is_active: true,
  video_file: null,
}

export default function AdminReels() {
  const [items, setItems] = useState<Reel[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [includeInactive, setIncludeInactive] = useState(true)
  const [notification, setNotification] = useState<string | null>(null)
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [comments, setComments] = useState<ReelComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentsSearch, setCommentsSearch] = useState('')
  const [includeHiddenComments, setIncludeHiddenComments] = useState(true)
  const [commentActionId, setCommentActionId] = useState<number | null>(null)
  const [userActionId, setUserActionId] = useState<number | null>(null)

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

        const response = await adminApiFetch(`${apiBaseUrl}/api/admin/reels?${params.toString()}`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('Failed to load reels')
        const json = (await response.json()) as { data?: Reel[]; current_page?: number }
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
    if (!selectedId) {
      setComments([])
      return
    }

    const controller = new AbortController()

    const fetchComments = async () => {
      setCommentsLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('include_hidden', includeHiddenComments ? 'true' : 'false')
        if (commentsSearch.trim()) params.set('search', commentsSearch.trim())

        const response = await adminApiFetch(
          `${apiBaseUrl}/api/admin/reels/${selectedId}/comments?${params.toString()}`,
          { signal: controller.signal },
        )

        if (!response.ok) throw new Error('Failed to load comments')

        const json = (await response.json()) as { data?: ReelComment[] }
        setComments(Array.isArray(json.data) ? json.data : [])
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setNotification(err instanceof Error ? err.message : 'Failed to load comments')
        setNotificationType('error')
      } finally {
        setCommentsLoading(false)
      }
    }

    void fetchComments()

    return () => controller.abort()
  }, [apiBaseUrl, commentsSearch, includeHiddenComments, selectedId])

  useEffect(() => {
    if (!selectedItem) return
    setForm({
      id: selectedItem.id,
      title: selectedItem.title ?? '',
      description: selectedItem.description ?? '',
      prompt: selectedItem.prompt ?? '',
      video_url: selectedItem.video_url ?? '',
      thumbnail_url: selectedItem.thumbnail_url ?? '',
      order: String(selectedItem.order ?? 0),
      is_active: Boolean(selectedItem.is_active),
      video_file: null,
    })
  }, [selectedItem])

  const resetForm = () => setForm(emptyForm)

  const selectItem = (item: Reel) => {
    setNotification(null)
    setForm({
      id: item.id,
      title: item.title ?? '',
      description: item.description ?? '',
      prompt: item.prompt ?? '',
      video_url: item.video_url ?? '',
      thumbnail_url: item.thumbnail_url ?? '',
      order: String(item.order ?? 0),
      is_active: Boolean(item.is_active),
      video_file: null,
    })
  }

  const save = async () => {
    setNotification(null)
    setSaving(true)

    try {
      const fd = new FormData()
      fd.append('title', form.title.trim())
      if (form.description.trim()) fd.append('description', form.description.trim())
      if (form.prompt.trim()) fd.append('prompt', form.prompt.trim())
      if (form.video_url.trim()) fd.append('video_url', form.video_url.trim())
      if (form.thumbnail_url.trim()) fd.append('thumbnail_url', form.thumbnail_url.trim())
      fd.append('order', String(Number.isFinite(Number(form.order)) ? Number(form.order) : 0))
      fd.append('is_active', form.is_active ? '1' : '0')
      if (form.video_file) fd.append('video_file', form.video_file)

      const isEdit = typeof form.id === 'number'
      const url = isEdit ? `${apiBaseUrl}/api/admin/reels/${form.id}` : `${apiBaseUrl}/api/admin/reels`

      const response = await adminApiFetch(url, {
        method: isEdit ? 'POST' : 'POST',
        body: isEdit ? (() => {
          fd.append('_method', 'PUT')
          return fd
        })() : fd,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const firstError =
          data.errors &&
          Object.values<string[]>(data.errors)
            .flat()
            .join(' ')
        throw new Error(firstError || data.message || 'Failed to save reel.')
      }

      const json = (await response.json()) as { data: Reel }
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
      setForm((prev) => ({ ...prev, video_file: null }))
    } catch (err) {
      setNotification(err instanceof Error ? err.message : 'Something went wrong')
      setNotificationType('error')
    } finally {
      setSaving(false)
    }
  }

  const deleteItem = async () => {
    if (!form.id) return
    const confirmed = window.confirm('Delete this reel? This will unpublish it.')
    if (!confirmed) return

    setNotification(null)
    setDeleting(true)

    try {
      const response = await adminApiFetch(`${apiBaseUrl}/api/admin/reels/${form.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to delete reel.')
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

  const setCommentVisibility = async (comment: ReelComment, nextVisible: boolean) => {
    setNotification(null)
    setCommentActionId(comment.id)

    try {
      const response = await adminApiFetch(`${apiBaseUrl}/api/admin/reel-comments/${comment.id}/visibility`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_visible: nextVisible }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to update comment.')
      }

      setComments((prev) => prev.map((c) => (c.id === comment.id ? { ...c, is_visible: nextVisible } : c)))
    } catch (err) {
      setNotification(err instanceof Error ? err.message : 'Something went wrong')
      setNotificationType('error')
    } finally {
      setCommentActionId(null)
    }
  }

  const deleteComment = async (comment: ReelComment) => {
    const confirmed = window.confirm('Delete this comment? This cannot be undone.')
    if (!confirmed) return

    setNotification(null)
    setCommentActionId(comment.id)

    try {
      const response = await adminApiFetch(`${apiBaseUrl}/api/admin/reel-comments/${comment.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to delete comment.')
      }

      setComments((prev) => prev.filter((c) => c.id !== comment.id))
    } catch (err) {
      setNotification(err instanceof Error ? err.message : 'Something went wrong')
      setNotificationType('error')
    } finally {
      setCommentActionId(null)
    }
  }

  const toggleUserBlock = async (comment: ReelComment) => {
    const nextBlocked = !comment.user_is_blocked
    const reason = nextBlocked ? window.prompt('Block reason (optional):', '') : null

    setNotification(null)
    setUserActionId(comment.user_id)

    try {
      const response = await adminApiFetch(`${apiBaseUrl}/api/admin/users/${comment.user_id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_blocked: nextBlocked, blocked_reason: nextBlocked ? (reason || null) : null }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to update user status.')
      }

      setComments((prev) =>
        prev.map((c) => (c.user_id === comment.user_id ? { ...c, user_is_blocked: nextBlocked } : c)),
      )
    } catch (err) {
      setNotification(err instanceof Error ? err.message : 'Something went wrong')
      setNotificationType('error')
    } finally {
      setUserActionId(null)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeading
        title="Reels"
        subtitle="Manage reels shown in the app feed."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Reels', isCurrent: true },
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
        <Card title="Library" subtitle="Search and pick a reel to edit.">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title..."
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

            {loading && <div className="text-xs text-slate-400">Loading reels…</div>}
            {!loading && items.length === 0 && <div className="text-xs text-slate-400">No reels found.</div>}

            {!loading && items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800 text-sm">
                  <thead className="bg-slate-900/80">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Title
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Likes
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Saves
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Shares
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Comments
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
                          <td className="px-4 py-2 text-xs text-slate-200">{item.likes_count}</td>
                          <td className="px-4 py-2 text-xs text-slate-200">{item.saves_count}</td>
                          <td className="px-4 py-2 text-xs text-slate-200">{item.shares_count ?? 0}</td>
                          <td className="px-4 py-2 text-xs text-slate-200">{item.comments_count}</td>
                          <td className="px-4 py-2 text-xs text-slate-300">{item.order}</td>
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

        <Card title={form.id ? 'Edit reel' : 'Create reel'} subtitle="Upload a video file or provide a URL.">
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

            <div className="space-y-2">
              <label className="block text-xs text-slate-300">Prompt (optional)</label>
              <textarea
                value={form.prompt}
                onChange={(e) => setForm((prev) => ({ ...prev, prompt: e.target.value }))}
                rows={3}
                className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-slate-300">Video URL (YouTube or direct)</label>
              <input
                value={form.video_url}
                onChange={(e) => setForm((prev) => ({ ...prev, video_url: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-slate-300">Video file (optional)</label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setForm((prev) => ({ ...prev, video_file: e.target.files?.[0] ?? null }))}
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
                <label className="block text-xs text-slate-300">Order</label>
                <input
                  value={form.order}
                  onChange={(e) => setForm((prev) => ({ ...prev, order: e.target.value }))}
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

      {form.id && (
        <Card title="Comments moderation" subtitle="Hide, delete, or block users for abusive content.">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <input
                value={commentsSearch}
                onChange={(e) => setCommentsSearch(e.target.value)}
                placeholder="Search comments or user email..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              />
              <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={includeHiddenComments}
                  onChange={(e) => setIncludeHiddenComments(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-600 focus:ring-sky-500"
                />
                Show hidden
              </label>
            </div>

            {commentsLoading && <div className="text-xs text-slate-400">Loading comments…</div>}
            {!commentsLoading && comments.length === 0 && (
              <div className="text-xs text-slate-400">No comments found for this reel.</div>
            )}

            {!commentsLoading && comments.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800 text-sm">
                  <thead className="bg-slate-900/80">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                        User
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Comment
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Visible
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {comments.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-900/70">
                        <td className="px-4 py-2 text-xs text-slate-200">
                          <div className="flex flex-col">
                            <span className="text-slate-100">{c.user_name}</span>
                            <span className="text-slate-400">{c.user_email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-xs text-slate-100">{c.body}</td>
                        <td className="px-4 py-2 text-xs">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              c.is_visible ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700/40 text-slate-300'
                            }`}
                          >
                            {c.is_visible ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-xs">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={commentActionId === c.id}
                              onClick={() => void setCommentVisibility(c, !c.is_visible)}
                              className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-[11px] font-semibold text-slate-100 hover:bg-slate-700/70 disabled:opacity-60"
                            >
                              {commentActionId === c.id ? 'Saving…' : c.is_visible ? 'Hide' : 'Unhide'}
                            </button>
                            <button
                              type="button"
                              disabled={commentActionId === c.id}
                              onClick={() => void deleteComment(c)}
                              className="inline-flex items-center rounded-lg border border-rose-600/70 bg-rose-900/20 px-3 py-1.5 text-[11px] font-semibold text-rose-100 hover:bg-rose-900/40 disabled:opacity-60"
                            >
                              {commentActionId === c.id ? 'Working…' : 'Delete'}
                            </button>
                            <button
                              type="button"
                              disabled={userActionId === c.user_id}
                              onClick={() => void toggleUserBlock(c)}
                              className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-[11px] font-semibold disabled:opacity-60 ${
                                c.user_is_blocked
                                  ? 'border-emerald-600/70 bg-emerald-900/20 text-emerald-100 hover:bg-emerald-900/40'
                                  : 'border-rose-600/70 bg-rose-900/20 text-rose-100 hover:bg-rose-900/40'
                              }`}
                            >
                              {userActionId === c.user_id
                                ? 'Saving…'
                                : c.user_is_blocked
                                  ? 'Unblock user'
                                  : 'Block user'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
