import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageHeading } from '../components/common/PageHeading'
import { Card } from '../components/ui/Card'
import { getApiBaseUrl } from '../config/apiBase'
import { adminApiFetch } from './api/adminSession'

type Plan = {
  id: number
  name: string
  description?: string | null
  price: string
  billing_frequency: 'monthly' | 'yearly' | 'custom'
  monthly_limit: number
  features: string[] | null
  limits: {
    user_count?: number | null
    storage_gb?: number | null
    custom?: string | null
  } | null
  is_active: boolean
  created_at: string
  deleted_at?: string | null
}

type PaginatedPlans = {
  data: Plan[]
}

type PlanFormState = {
  id?: number
  name: string
  description: string
  price: string
  billing_frequency: 'monthly' | 'yearly' | 'custom'
  monthly_limit: string
  features: string[]
  limits_user_count: string
  limits_storage_gb: string
  limits_custom: string
  is_active: boolean
}

const emptyForm: PlanFormState = {
  name: '',
  description: '',
  price: '',
  billing_frequency: 'monthly',
  monthly_limit: '',
  features: [''],
  limits_user_count: '',
  limits_storage_gb: '',
  limits_custom: '',
  is_active: true,
}

function formatMoney(price: string | number) {
  const value = typeof price === 'string' ? parseFloat(price) : price
  if (Number.isNaN(value)) return '—'
  return `₹${value.toFixed(2)}`
}

export default function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all')
  const [sortKey, setSortKey] = useState<'created_at' | 'price' | 'name'>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [form, setForm] = useState<PlanFormState>(emptyForm)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)
  const [notificationType, setNotificationType] = useState<'success' | 'error' | null>(null)

  const apiBaseUrl = getApiBaseUrl()

  const filteredPlans = useMemo(() => {
    const term = search.toLowerCase()
    let result = plans.filter((plan) => {
      if (!term) return true
      const haystack = [
        plan.name,
        plan.description ?? '',
        plan.billing_frequency,
        plan.features?.join(' ') ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })

    if (statusFilter === 'active') {
      result = result.filter((plan) => plan.is_active && !plan.deleted_at)
    }

    if (statusFilter === 'archived') {
      result = result.filter((plan) => !!plan.deleted_at)
    }

    result = result.sort((a, b) => {
      let aVal: string | number = ''
      let bVal: string | number = ''
      if (sortKey === 'name') {
        aVal = a.name.toLowerCase()
        bVal = b.name.toLowerCase()
      } else if (sortKey === 'price') {
        aVal = parseFloat(a.price)
        bVal = parseFloat(b.price)
      } else {
        aVal = a.created_at
        bVal = b.created_at
      }

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [plans, search, sortKey, sortDir, statusFilter])

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await adminApiFetch(`${apiBaseUrl}/api/admin/plans?with_trashed=1`)

      if (!response.ok) {
        throw new Error('Failed to load plans')
      }

      const json = (await response.json()) as PaginatedPlans
      setPlans(json.data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl])

  useEffect(() => {
    void loadPlans()
  }, [loadPlans])

  const resetForm = () => {
    setForm(emptyForm)
    setIsEditing(false)
  }

  const openCreate = () => {
    resetForm()
  }

  const openEdit = (plan: Plan) => {
    setForm({
      id: plan.id,
      name: plan.name,
      description: plan.description ?? '',
      price: plan.price.toString(),
      billing_frequency: plan.billing_frequency,
      monthly_limit: plan.monthly_limit?.toString() ?? '',
      features: plan.features && plan.features.length > 0 ? plan.features : [''],
      limits_user_count: plan.limits?.user_count?.toString() ?? '',
      limits_storage_gb: plan.limits?.storage_gb?.toString() ?? '',
      limits_custom: plan.limits?.custom ?? '',
      is_active: plan.is_active,
    })
    setIsEditing(true)
  }

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification(message)
    setNotificationType(type)
    window.setTimeout(() => {
      setNotification(null)
      setNotificationType(null)
    }, 2500)
  }

  const handleFeatureChange = (index: number, value: string) => {
    setForm((prev) => {
      const next = [...prev.features]
      next[index] = value
      return { ...prev, features: next }
    })
  }

  const addFeatureRow = () => {
    setForm((prev) => ({ ...prev, features: [...prev.features, ''] }))
  }

  const removeFeatureRow = (index: number) => {
    setForm((prev) => {
      const next = prev.features.filter((_, i) => i !== index)
      return { ...prev, features: next.length > 0 ? next : [''] }
    })
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      showNotification('Plan name is required.', 'error')
      return
    }
    if (!form.price || Number.isNaN(parseFloat(form.price))) {
      showNotification('Please enter a valid price.', 'error')
      return
    }

    setIsSaving(true)

    const body = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: parseFloat(form.price),
      billing_frequency: form.billing_frequency,
      monthly_limit: form.monthly_limit ? parseInt(form.monthly_limit, 10) : null,
      features: form.features.map((f) => f.trim()).filter(Boolean),
      limits: {
        user_count: form.limits_user_count ? parseInt(form.limits_user_count, 10) : null,
        storage_gb: form.limits_storage_gb ? parseInt(form.limits_storage_gb, 10) : null,
        custom: form.limits_custom.trim() || null,
      },
      is_active: form.is_active,
    }

    try {
      const url = form.id
        ? `${apiBaseUrl}/api/admin/plans/${form.id}`
        : `${apiBaseUrl}/api/admin/plans`

      const response = await adminApiFetch(url, {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const message =
          (data.errors && Object.values<string[]>(data.errors).flat().join(' ')) ||
          data.message ||
          'Failed to save plan.'
        throw new Error(message)
      }

      await loadPlans()
      resetForm()
      showNotification(form.id ? 'Plan updated successfully.' : 'Plan created successfully.', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong while saving.'
      showNotification(message, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSoftDelete = async (plan: Plan) => {
    const confirmed = window.confirm(
      `Are you sure you want to deactivate and archive the "${plan.name}" plan? Users already on this plan will not be automatically changed.`,
    )
    if (!confirmed) return

    try {
      const response = await adminApiFetch(`${apiBaseUrl}/api/admin/plans/${plan.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete plan.')
      }

      await loadPlans()
      showNotification('Plan deactivated (soft deleted).', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong while deleting.'
      showNotification(message, 'error')
    }
  }

  const headerSort = (key: 'name' | 'price' | 'created_at') => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <div className="space-y-4">
      <PageHeading
        title="Pricing plans"
        subtitle="Create and manage subscription plans available to users."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Pricing', isCurrent: true },
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

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card
          title="Plans"
          subtitle="Browse, search, and manage all pricing plans."
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-3">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, features, or billing frequency..."
                  className="w-full sm:max-w-xs rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                />
                <div className="inline-flex items-center gap-2 text-[11px] text-slate-300">
                  <span>Status:</span>
                  <div className="inline-flex rounded-lg border border-slate-700/80 bg-slate-900/70 p-0.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setStatusFilter('all')}
                      className={`px-2 py-0.5 rounded-md ${
                        statusFilter === 'all'
                          ? 'bg-slate-800 text-slate-100'
                          : 'text-slate-400 hover:text-slate-100'
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('active')}
                      className={`px-2 py-0.5 rounded-md ${
                        statusFilter === 'active'
                          ? 'bg-slate-800 text-emerald-200'
                          : 'text-slate-400 hover:text-slate-100'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('archived')}
                      className={`px-2 py-0.5 rounded-md ${
                        statusFilter === 'archived'
                          ? 'bg-slate-800 text-slate-200'
                          : 'text-slate-400 hover:text-slate-100'
                      }`}
                    >
                      Archived
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-sky-600 hover:to-indigo-700"
              >
                New plan
              </button>
            </div>

            {loading && <p className="text-xs text-slate-400">Loading plans…</p>}
            {error && <p className="text-xs text-rose-400">{error}</p>}

            {!loading && !error && filteredPlans.length === 0 && (
              <p className="text-xs text-slate-400">No plans found.</p>
            )}

            {filteredPlans.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800 text-xs">
                  <thead className="bg-slate-900/80">
                    <tr>
                      <th
                        className="px-3 py-2 text-left font-semibold uppercase tracking-wide text-slate-400 cursor-pointer"
                        onClick={() => headerSort('name')}
                      >
                        Name
                      </th>
                      <th
                        className="px-3 py-2 text-left font-semibold uppercase tracking-wide text-slate-400 cursor-pointer"
                        onClick={() => headerSort('price')}
                      >
                        Price
                      </th>
                      <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide text-slate-400">
                        Billing
                      </th>
                      <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide text-slate-400">
                        Features
                      </th>
                      <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide text-slate-400">
                        Status
                      </th>
                      <th
                        className="px-3 py-2 text-left font-semibold uppercase tracking-wide text-slate-400 cursor-pointer"
                        onClick={() => headerSort('created_at')}
                      >
                        Created
                      </th>
                      <th className="px-3 py-2 text-right font-semibold uppercase tracking-wide text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {filteredPlans.map((plan) => (
                      <tr key={plan.id} className="hover:bg-slate-900/60">
                        <td className="px-3 py-2 text-slate-100">
                          <div className="flex flex-col">
                            <span className="font-medium">{plan.name}</span>
                            {plan.description && (
                              <span className="text-[11px] text-slate-500 line-clamp-1">
                                {plan.description}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-slate-100">
                          <div className="flex flex-col">
                            <span>{formatMoney(plan.price)}</span>
                            <span className="text-[11px] text-slate-500">
                              per {plan.billing_frequency === 'custom' ? 'period' : plan.billing_frequency}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-slate-200">
                          {plan.billing_frequency.charAt(0).toUpperCase() +
                            plan.billing_frequency.slice(1)}
                        </td>
                        <td className="px-3 py-2 text-slate-200">
                          {plan.features && plan.features.length > 0 ? (
                            <ul className="list-disc pl-4 space-y-0.5">
                              {plan.features.slice(0, 3).map((feature) => (
                                <li key={feature} className="text-[11px] text-slate-300">
                                  {feature}
                                </li>
                              ))}
                              {plan.features.length > 3 && (
                                <li className="text-[11px] text-slate-500">
                                  +{plan.features.length - 3} more
                                </li>
                              )}
                            </ul>
                          ) : (
                            <span className="text-[11px] text-slate-500">No features listed</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              plan.deleted_at
                                ? 'bg-slate-800 text-slate-400 border border-slate-700/70'
                                : plan.is_active
                                  ? 'bg-emerald-900/40 text-emerald-200 border border-emerald-700/70'
                                  : 'bg-slate-900/60 text-slate-300 border border-slate-700/80'
                            }`}
                          >
                            {plan.deleted_at ? 'Archived' : plan.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-300">
                          {new Date(plan.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => openEdit(plan)}
                            className="rounded-lg border border-slate-700/80 px-2 py-1 text-[11px] text-slate-200 hover:border-sky-500/60 hover:text-sky-200"
                          >
                            Edit
                          </button>
                          {!plan.deleted_at && (
                            <button
                              type="button"
                              onClick={() => handleSoftDelete(plan)}
                              className="rounded-lg border border-rose-700/80 px-2 py-1 text-[11px] text-rose-200 hover:bg-rose-950/40"
                            >
                              Deactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>

        <Card
          title={form.id ? 'Edit plan' : 'Create plan'}
          subtitle={
            form.id ? 'Update an existing pricing plan.' : 'Define a new pricing plan for users.'
          }
        >
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-[11px] text-slate-300">Plan name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] text-slate-300">Billing frequency</label>
                <select
                  value={form.billing_frequency}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      billing_frequency: e.target.value as PlanFormState['billing_frequency'],
                    }))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-[11px] text-slate-300">Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] text-slate-300">
                  Monthly prompt limit (optional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.monthly_limit}
                  onChange={(e) => setForm((prev) => ({ ...prev, monthly_limit: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] text-slate-300">Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] text-slate-300">Features</label>
                <button
                  type="button"
                  onClick={addFeatureRow}
                  className="rounded-lg border border-slate-700 px-2 py-0.5 text-[11px] text-slate-200 hover:border-sky-500/70 hover:text-sky-200"
                >
                  Add feature
                </button>
              </div>
              <div className="space-y-1.5">
                {form.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value)}
                      className="flex-1 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeFeatureRow(index)}
                      className="rounded-lg border border-slate-700/80 px-2 py-1 text-[11px] text-slate-300 hover:border-rose-500/70 hover:text-rose-200"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1.5">
                <label className="block text-[11px] text-slate-300">
                  Max users (optional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.limits_user_count}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, limits_user_count: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] text-slate-300">
                  Storage (GB, optional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.limits_storage_gb}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, limits_storage_gb: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] text-slate-300">
                  Other limitations (optional)
                </label>
                <input
                  type="text"
                  value={form.limits_custom}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, limits_custom: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <label className="inline-flex items-center gap-2 text-[11px] text-slate-200">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                  className="h-3 w-3 rounded border-slate-600 bg-slate-900 text-sky-500 focus:ring-sky-500"
                />
                <span>Plan is active and available for new users</span>
              </label>
              <div className="flex items-center gap-2">
                {isEditing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] text-slate-200 hover:border-slate-500/80"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSave}
                  className="rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:from-sky-600 hover:to-indigo-700 disabled:opacity-60"
                >
                  {isSaving ? 'Saving…' : form.id ? 'Save changes' : 'Create plan'}
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
