import { useEffect, useState } from 'react'
import { PageHeading } from '../components/common/PageHeading'
import { Card } from '../components/ui/Card'
import { getApiBaseUrl } from '../config/apiBase'
import { adminApiFetch } from './api/adminSession'

type User = {
  id: number
  name: string
  email: string
  is_blocked?: boolean
  blocked_at?: string | null
  blocked_reason?: string | null
  plan?: {
    id: number
    name: string
  } | null
}

type PaginatedUsers = {
  data: User[]
}

type AdminPlanSummary = {
  id: number
  name: string
  is_active: boolean
  deleted_at?: string | null
}

type PaginatedPlans = {
  data: AdminPlanSummary[]
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [plans, setPlans] = useState<AdminPlanSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingUserId, setSavingUserId] = useState<number | null>(null)
  const [blockingUserId, setBlockingUserId] = useState<number | null>(null)
  const apiBaseUrl = getApiBaseUrl()

  useEffect(() => {
    const controller = new AbortController()

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [usersResponse, plansResponse] = await Promise.all([
          adminApiFetch(`${apiBaseUrl}/api/admin/users`, {
            signal: controller.signal,
          }),
          adminApiFetch(`${apiBaseUrl}/api/admin/plans`, {
            signal: controller.signal,
          }),
        ])

        if (!usersResponse.ok) {
          throw new Error('Failed to load users')
        }

        if (!plansResponse.ok) {
          throw new Error('Failed to load plans')
        }

        const usersJson = (await usersResponse.json()) as PaginatedUsers
        const plansJson = (await plansResponse.json()) as PaginatedPlans

        setUsers(usersJson.data)
        setPlans(plansJson.data)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        const message = err instanceof Error ? err.message : 'Something went wrong'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    void fetchData()

    return () => controller.abort()
  }, [apiBaseUrl])

  const activePlans = plans.filter((plan) => plan.is_active && !plan.deleted_at)

  const handleToggleBlock = async (user: User) => {
    const nextBlocked = !user.is_blocked
    const reason = nextBlocked ? window.prompt('Block reason (optional):', user.blocked_reason ?? '') : null

    setBlockingUserId(user.id)
    setError(null)

    try {
      const response = await adminApiFetch(`${apiBaseUrl}/api/admin/users/${user.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_blocked: nextBlocked,
          blocked_reason: nextBlocked ? (reason || null) : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const message =
          (data.errors && Object.values<string[]>(data.errors).flat().join(' ')) ||
          data.message ||
          'Failed to update user status.'
        throw new Error(message)
      }

      const updatedUser = (await response.json()) as User
      setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
    } finally {
      setBlockingUserId(null)
    }
  }

  const handleChangePlan = async (user: User, value: string) => {
    const planId = value === '' ? null : Number(value)

    setSavingUserId(user.id)

    try {
      const response = await adminApiFetch(`${apiBaseUrl}/api/admin/users/${user.id}/plan`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: planId,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const message =
          (data.errors && Object.values<string[]>(data.errors).flat().join(' ')) ||
          data.message ||
          'Failed to update user plan.'
        throw new Error(message)
      }

      const updatedUser = (await response.json()) as User

      setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
    } finally {
      setSavingUserId(null)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeading
        title="Users"
        subtitle="Browse users, update plans, and block accounts."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Users', isCurrent: true },
        ]}
      />

      {loading && <p className="text-slate-400 text-sm">Loading users…</p>}
      {error && <p className="text-sm text-rose-400 mb-3">{error}</p>}

      {!loading && users.length === 0 && !error && (
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 px-4 py-6 text-xs text-slate-300">
          No users found.
        </div>
      )}

      {users.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-900/80">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    ID
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Plan
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-900/70">
                    <td className="px-4 py-2 text-xs text-slate-400">{user.id}</td>
                    <td className="px-4 py-2 text-xs text-slate-100">{user.name}</td>
                    <td className="px-4 py-2 text-xs text-slate-200">{user.email}</td>
                    <td className="px-4 py-2 text-xs text-slate-200">
                      <select
                        value={user.plan?.id ?? ''}
                        onChange={(e) => handleChangePlan(user, e.target.value)}
                        disabled={savingUserId === user.id}
                        className="min-w-[8rem] rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                      >
                        <option value="">Free / no plan</option>
                        {activePlans.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            user.is_blocked ? 'bg-rose-500/15 text-rose-300' : 'bg-emerald-500/15 text-emerald-300'
                          }`}
                        >
                          {user.is_blocked ? 'Blocked' : 'Active'}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleToggleBlock(user)}
                          disabled={blockingUserId === user.id}
                          className={`inline-flex items-center rounded-lg border px-2 py-1 text-[11px] font-semibold disabled:opacity-60 ${
                            user.is_blocked
                              ? 'border-emerald-600/70 bg-emerald-900/20 text-emerald-100 hover:bg-emerald-900/40'
                              : 'border-rose-600/70 bg-rose-900/20 text-rose-100 hover:bg-rose-900/40'
                          }`}
                        >
                          {blockingUserId === user.id ? 'Saving…' : user.is_blocked ? 'Unblock' : 'Block'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
