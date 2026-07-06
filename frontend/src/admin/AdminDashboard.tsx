'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeading } from '../components/common/PageHeading'
import { Card } from '../components/ui/Card'
import { getApiBaseUrl } from '../config/apiBase'
import { adminApiFetch } from './api/adminSession'

type DashboardStats = {
  total_users: number
  active_today: number
  prompts_today: number
  tokens_today: number
  estimated_cost_today: number
  avg_response_time_ms: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const apiBaseUrl = getApiBaseUrl()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminApiFetch(`${apiBaseUrl}/api/admin/dashboard`)

        if (!response.ok) {
          throw new Error('Failed to load dashboard data')
        }

        const data = (await response.json()) as DashboardStats
        setStats(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    void fetchStats()
  }, [apiBaseUrl])

  return (
    <>
      <PageHeading
        title="Overview"
        subtitle="High-level usage, engagement, and cost metrics across Vakyapro."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Overview', isCurrent: true },
        ]}
      />

      {loading && <p className="text-slate-400 text-sm">Loading dashboard...</p>}
      {error && <p className="text-sm text-rose-400 mb-4">{error}</p>}

      {stats && (
        <div className="grid gap-5 md:grid-cols-3">
          <Card
            title="Total Users"
            subtitle="All registered users"
          >
            <div className="text-3xl font-semibold text-slate-50">
              {stats.total_users.toLocaleString()}
            </div>
          </Card>

          <Card
            title="Active Today"
            subtitle="Users with at least one prompt"
          >
            <div className="text-3xl font-semibold text-sky-400">
              {stats.active_today.toLocaleString()}
            </div>
          </Card>

          <Card
            title="Prompts Today"
            subtitle="Total prompts processed"
          >
            <div className="text-3xl font-semibold text-indigo-400">
              {stats.prompts_today.toLocaleString()}
            </div>
          </Card>

          <Card
            title="Tokens Today"
            subtitle="Approximate token consumption"
          >
            <div className="text-2xl font-semibold text-purple-400">
              {stats.tokens_today.toLocaleString()}
            </div>
          </Card>

          <Card
            title="Estimated Cost"
            subtitle="Spend for today"
          >
            <div className="text-2xl font-semibold text-emerald-400">
              ${stats.estimated_cost_today.toFixed(2)}
            </div>
          </Card>

          <Card
            title="Avg Response Time"
            subtitle="End-to-end latency"
          >
            <div className="text-2xl font-semibold text-amber-400">
              {stats.avg_response_time_ms} ms
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
