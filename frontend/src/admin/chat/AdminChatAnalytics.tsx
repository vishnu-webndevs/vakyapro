import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { getApiBaseUrl } from '../../config/apiBase'
import { adminApiFetch } from '../api/adminSession'

type Analytics = {
  total_chats: number
  open_chats: number
  closed_chats: number
  messages_today: number
  impersonated_messages: number
  messages_per_day: { date: string; total: number }[]
}

export default function AdminChatAnalytics() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [, setError] = useState<string | null>(null)
  const apiBaseUrl = getApiBaseUrl()

  useEffect(() => {
    const controller = new AbortController()

    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await adminApiFetch(`${apiBaseUrl}/api/admin/chat-analytics`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Failed to load analytics')
        }

        const json = (await response.json()) as Analytics
        setData(json)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        const message = err instanceof Error ? err.message : 'Something went wrong'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    void fetchAnalytics()

    return () => controller.abort()
  }, [apiBaseUrl])

  if (loading) {
    return <div className="text-xs text-slate-400">Loading analytics…</div>
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 px-4 py-6 text-xs text-slate-300">
        No analytics data available.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-50">Chat analytics</h1>
        <p className="text-xs text-slate-400">
          Monitor chat volume, impersonation usage, and engagement over time.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Total chats" className="py-4">
          <p className="text-2xl font-semibold text-slate-50">{data.total_chats}</p>
        </Card>
        <Card title="Open chats" className="py-4">
          <p className="text-2xl font-semibold text-emerald-300">{data.open_chats}</p>
        </Card>
        <Card title="Closed chats" className="py-4">
          <p className="text-2xl font-semibold text-slate-200">{data.closed_chats}</p>
        </Card>
        <Card title="Messages today" className="py-4">
          <p className="text-2xl font-semibold text-sky-300">{data.messages_today}</p>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card
          title="Impersonated messages"
          subtitle="Messages sent while impersonating a customer"
          className="py-4"
        >
          <p className="text-2xl font-semibold text-amber-300">
            {data.impersonated_messages}
          </p>
        </Card>

        <Card
          title="Messages per day"
          subtitle="Last 14 days"
          className="py-4"
        >
          {data.messages_per_day.length === 0 ? (
            <p className="text-xs text-slate-400">No messages yet.</p>
          ) : (
            <ul className="space-y-1 text-xs text-slate-200">
              {data.messages_per_day.map((row) => (
                <li key={row.date} className="flex items-center justify-between">
                  <span>{row.date}</span>
                  <span className="font-semibold">{row.total}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
