import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { getApiBaseUrl } from '../../config/apiBase'
import { adminApiFetch } from '../api/adminSession'

type Customer = {
  id: number
  name?: string
  email?: string
  external_id?: string
}

type Chat = {
  id: number
  status: string
  last_message_at?: string
  last_message_preview?: string
  customer: Customer
}

type PaginatedResponse<T> = {
  data: T[]
}

export default function AdminChatList() {
  const [chats, setChats] = useState<Chat[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const router = useRouter()
  const apiBaseUrl = getApiBaseUrl()

  useEffect(() => {
    const controller = new AbortController()

    const fetchChats = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        if (search.trim()) {
          params.set('search', search.trim())
        }

        const response = await adminApiFetch(
          `${apiBaseUrl}/api/admin/chats?${params.toString()}`,
          {
            signal: controller.signal,
          },
        )

        if (!response.ok) {
          throw new Error('Failed to load chats')
        }

        const data = (await response.json()) as PaginatedResponse<Chat>
        setChats(data.data)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        const message = err instanceof Error ? err.message : 'Something went wrong'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    void fetchChats()

    return () => controller.abort()
  }, [apiBaseUrl, router, search])

  const handleCreateChat = async () => {
    setCreating(true)
    setCreateError(null)

    try {
      const response = await adminApiFetch(`${apiBaseUrl}/api/admin/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Admin test chat',
          external_id: `admin-test-${Date.now()}`,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to create chat')
      }

      const chat = (await response.json()) as Chat
      setChats((prev) => [chat, ...prev])
       router.push(`/admin/chats?id=${chat.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong while creating chat'
      setCreateError(message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Customer chats</h1>
          <p className="text-xs text-slate-400">
            View ongoing conversations and impersonate customers when needed.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="w-full rounded-xl border border-slate-700/80 bg-slate-900/70 px-8 py-2 text-xs text-slate-100 outline-none focus:border-sky-500/70"
            />
          </div>
          <button
            type="button"
            onClick={handleCreateChat}
            disabled={creating}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:from-sky-600 hover:to-indigo-600 disabled:opacity-60"
          >
            {creating ? 'Creating…' : 'Add new chat'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-700/70 bg-rose-950/60 px-3 py-2 text-xs text-rose-100">
          {error}
        </div>
      )}

      {createError && (
        <div className="rounded-xl border border-rose-700/70 bg-rose-950/60 px-3 py-2 text-xs text-rose-100">
          {createError}
        </div>
      )}

      {loading ? (
        <div className="text-xs text-slate-400">Loading chats…</div>
      ) : chats.length === 0 ? (
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 px-4 py-6 text-center text-xs text-slate-400">
          No chats found.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {chats.map((chat) => (
            <Card
              key={chat.id}
              interactive
              className="flex cursor-pointer flex-col gap-2"
              onClick={() => router.push(`/admin/chats?id=${chat.id}`)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold text-slate-50">
                    {chat.customer.name || chat.customer.email || `Customer #${chat.customer.id}`}
                  </div>
                  {chat.customer.email && (
                    <div className="text-[11px] text-slate-400">{chat.customer.email}</div>
                  )}
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    chat.status === 'open'
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-700/40 text-slate-200 border border-slate-500/40'
                  }`}
                >
                  {chat.status}
                </span>
              </div>
              {chat.last_message_preview && (
                <p className="line-clamp-2 text-xs text-slate-300">
                  {chat.last_message_preview}
                </p>
              )}
              {chat.last_message_at && (
                <div className="mt-1 text-[11px] text-slate-500">
                  Last message at {new Date(chat.last_message_at).toLocaleString()}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
