'use client'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Minus } from 'lucide-react'
import { getApiBaseUrl } from '../config/apiBase'
import { Card } from './ui/Card'
import { useMeta } from '../hooks/useMeta'

type PublicPlan = {
  id: number
  name: string
  description?: string | null
  price: number | string
  billing_frequency: 'monthly' | 'yearly' | 'custom'
  features: string[] | null
  limits?: {
    user_count?: number | null
    storage_gb?: number | null
    custom?: string | null
  } | null
}

type PricingSectionProps = {
  variant?: 'homepage' | 'full'
}

function formatMoney(value: number | string) {
  const numeric =
    typeof value === 'number'
      ? value
      : Number.parseFloat(value.replace?.(/[^0-9.-]/g, '') ?? String(value))

  if (!Number.isFinite(numeric)) return '—'
  return `₹${numeric.toFixed(2)}`
}

export default function PricingSection({ variant = 'homepage' }: PricingSectionProps) {
  const [plans, setPlans] = useState<PublicPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [billingFilter, setBillingFilter] = useState<'all' | 'monthly' | 'yearly'>('monthly')

  const apiBaseUrl = getApiBaseUrl()

  useEffect(() => {
    const controller = new AbortController()

    const loadPlans = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`${apiBaseUrl}/api/plans`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Failed to load pricing plans.')
        }

        const json = (await response.json()) as PublicPlan[]
        setPlans(json)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        const message = err instanceof Error ? err.message : 'Something went wrong while loading pricing.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    void loadPlans()

    return () => controller.abort()
  }, [apiBaseUrl])

  useMeta(variant === 'full' ? {
    title: 'Pricing | Vakyapro',
    description: 'Transparent pricing for Vakyapro with flexible plans for individuals and teams.',
    ogTitle: 'Vakyapro Pricing',
    ogDescription: 'Transparent pricing for Vakyapro with flexible plans for individuals and teams.',
    twitterTitle: 'Vakyapro Pricing',
    twitterDescription: 'Transparent pricing for Vakyapro with flexible plans for individuals and teams.',
  } : {})

  useEffect(() => {
    if (variant !== 'full') return

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Vakyapro',
      description: 'Transparent pricing for Vakyapro with flexible plans for individuals and teams.',
      offers: plans.map((plan) => ({
        '@type': 'Offer',
        name: plan.name,
        price: typeof plan.price === 'number' ? plan.price : Number.parseFloat(String(plan.price)),
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        category: plan.billing_frequency,
      })),
    }
    script.text = JSON.stringify(structuredData)
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [variant, plans])

  const visiblePlans = useMemo(() => {
    if (variant !== 'full') return plans

    if (billingFilter === 'monthly') {
      return plans.filter((plan) => plan.billing_frequency === 'monthly')
    }

    if (billingFilter === 'yearly') {
      return plans.filter((plan) => plan.billing_frequency === 'yearly')
    }

    return plans
  }, [plans, billingFilter, variant])

  const featureRows = useMemo(() => {
    if (variant !== 'full') return []

    const allFeatures = visiblePlans.flatMap((plan) => plan.features ?? [])
    return Array.from(new Set(allFeatures))
  }, [visiblePlans, variant])

  const heading = variant === 'homepage' ? 'Flexible pricing for every team' : 'Choose the plan that fits your workflow'
  const subheading =
    variant === 'homepage'
      ? 'Start free and upgrade when you need deeper prompt analytics and collaboration.'
      : 'Transparent pricing with no hidden fees. Switch plans or cancel at any time.'

  return (
    <section
      id="pricing"
      className={`px-4 py-16 sm:px-6 lg:px-8 ${
        variant === 'homepage'
          ? 'bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900'
          : 'bg-gradient-to-b from-slate-950 via-slate-950 to-black'
      }`}
    >
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
            {heading}
          </h2>
          <p className="mt-3 text-sm text-slate-400 max-w-xl mx-auto">{subheading}</p>
        </div>

        {variant === 'full' && (
          <div className="mb-8 flex flex-col items-center justify-between gap-4 text-xs sm:flex-row">
            <div
              className="flex items-center gap-3"
              role="group"
              aria-label="Select billing frequency"
            >
              <span className="text-slate-400">Billing</span>
              <div className="inline-flex rounded-full border border-slate-700/80 bg-slate-900/80 p-1">
                <button
                  type="button"
                  onClick={() => setBillingFilter('monthly')}
                  aria-pressed={billingFilter === 'monthly'}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                    billingFilter === 'monthly'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-300 hover:text-slate-50'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingFilter('yearly')}
                  aria-pressed={billingFilter === 'yearly'}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                    billingFilter === 'yearly'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-300 hover:text-slate-50'
                  }`}
                >
                  Yearly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingFilter('all')}
                  aria-pressed={billingFilter === 'all'}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                    billingFilter === 'all'
                      ? 'bg-slate-800 text-slate-100'
                      : 'text-slate-300 hover:text-slate-50'
                  }`}
                >
                  All
                </button>
              </div>
            </div>
            {featureRows.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('pricing-comparison')
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }}
                className="rounded-full border border-slate-700/80 px-4 py-1.5 text-[11px] font-medium text-slate-200 hover:border-sky-500 hover:text-sky-300"
              >
                Compare all features
              </button>
            )}
          </div>
        )}

        {loading && (
          <p className="text-center text-sm text-slate-400">Loading pricing…</p>
        )}

        {error && (
          <p className="text-center text-sm text-rose-400">{error}</p>
        )}

        {!loading && !error && visiblePlans.length === 0 && (
          <p className="text-center text-sm text-slate-400">
            Pricing will be announced soon. Stay tuned.
          </p>
        )}

        {visiblePlans.length > 0 && (
          <div
            className={`grid gap-6 ${
              variant === 'homepage'
                ? 'md:grid-cols-3'
                : 'md:grid-cols-3 lg:grid-cols-3'
            }`}
          >
            {visiblePlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
              >
                <Card
                  className="flex flex-col justify-between bg-slate-950/80"
                  title={plan.name}
                  subtitle={plan.description}
                  interactive
                  headerRight={
                    <div className="text-right">
                      <div className="text-lg font-semibold text-sky-300">
                        {formatMoney(plan.price)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        per {plan.billing_frequency === 'custom' ? 'period' : plan.billing_frequency}
                      </div>
                    </div>
                  }
                >
                  <div className="space-y-3 text-xs text-slate-200">
                    {plan.features && plan.features.length > 0 && (
                      <ul className="space-y-1">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-400" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {plan.limits && (plan.limits.user_count || plan.limits.storage_gb || plan.limits.custom) && (
                      <div className="mt-2 rounded-lg border border-slate-800/80 bg-slate-900/70 px-3 py-2 text-[11px] text-slate-300">
                        <div className="mb-1 font-semibold text-slate-200">Included limits</div>
                        {plan.limits.user_count && <div>Up to {plan.limits.user_count} seats</div>}
                        {plan.limits.storage_gb && <div>{plan.limits.storage_gb} GB storage</div>}
                        {plan.limits.custom && <div>{plan.limits.custom}</div>}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-[11px] text-slate-400">
                      No long‑term contracts. Cancel anytime.
                    </div>
                    <button
                      type="button"
                      className="rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:from-sky-600 hover:to-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                    >
                      Get started
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {variant === 'full' && featureRows.length > 0 && visiblePlans.length > 0 && (
          <div
            id="pricing-comparison"
            className="mt-12 overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4"
            aria-label="Plan feature comparison"
          >
            <table className="min-w-full border-separate border-spacing-x-4 text-left text-xs text-slate-200">
              <thead>
                <tr>
                  <th scope="col" className="py-2 pr-4 text-[11px] font-semibold text-slate-400">
                    Features
                  </th>
                  {visiblePlans.map((plan) => (
                    <th
                      key={plan.id}
                      scope="col"
                      className="py-2 text-[11px] font-semibold text-slate-200"
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureRows.map((feature) => (
                  <tr key={feature} className="border-t border-slate-800/60">
                    <th
                      scope="row"
                      className="py-2 pr-4 text-[11px] font-medium text-slate-300"
                    >
                      {feature}
                    </th>
                    {visiblePlans.map((plan) => {
                      const hasFeature = (plan.features ?? []).includes(feature)
                      return (
                        <td key={plan.id} className="py-2 text-center align-middle">
                          {hasFeature ? (
                            <Check
                              aria-label={`${plan.name} includes ${feature}`}
                              className="mx-auto h-4 w-4 text-emerald-400"
                            />
                          ) : (
                            <Minus
                              aria-hidden="true"
                              className="mx-auto h-4 w-4 text-slate-600"
                            />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
