'use client'
import { memo, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Brain, Menu, X } from 'lucide-react'
import { Button } from '../ui/Button'

export interface HeaderNavItem {
  label: string
  to: string
  external?: boolean
}

export interface SiteHeaderProps {
  brandName?: string
  logo?: ReactNode
  navItems?: HeaderNavItem[]
  isAuthenticated?: boolean
  onSignIn?: () => void
  onSignOut?: () => void
  sticky?: boolean
}

function SiteHeaderComponent({
  brandName = 'Vakyapro',
  logo,
  navItems,
  isAuthenticated,
  onSignIn,
  onSignOut,
  sticky = true,
}: SiteHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const items = navItems ?? [
    { label: 'Product', to: '/#product' },
    { label: 'How it works', to: '/#how-it-works' },
    { label: 'Pricing', to: '/#pricing' },
  ]

  const isActive = (to: string) => {
    if (to.includes('#')) {
      const path = to.split('#')[0] || '/'
      return pathname === path
    }
    return pathname === to
  }

  return (
    <header
      className={`z-40 w-full border-b border-slate-800/60 bg-gradient-to-b from-slate-950/90 via-slate-950/80 to-slate-950/30 backdrop-blur-xl ${sticky ? 'sticky top-0' : ''}`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-fuchsia-500">
            {logo ?? <Brain className="h-4 w-4 text-white" aria-hidden="true" />}
          </div>
          <span className="bg-gradient-to-r from-sky-300 via-cyan-200 to-indigo-300 bg-clip-text text-sm font-semibold tracking-tight text-transparent md:text-base">
            {brandName}
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-xs text-slate-300 md:flex">
          {items.map((item) =>
            item.external ? (
              <a
                key={item.label}
                href={item.to}
                className="hover:text-slate-50"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                href={item.to}
                className={`transition-colors ${isActive(item.to) ? 'text-sky-300' : 'hover:text-slate-50'}`}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {!isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSignIn}
            >
              Login
            </Button>
          )}
          <Button
            size="sm"
            variant="primary"
            onClick={isAuthenticated ? onSignOut : onSignIn}
          >
            {isAuthenticated ? 'Dashboard' : 'Join Waitlist'}
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center justify-center rounded-md p-2 text-slate-300 hover:bg-slate-800 hover:text-slate-50 md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isOpen && (
        <nav className="border-t border-slate-800/70 bg-slate-950/95 px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-2 text-sm text-slate-200">
            {items.map((item) =>
              item.external ? (
                <a
                  key={item.label}
                  href={item.to}
                  className="rounded-lg px-3 py-2 hover:bg-slate-900"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.label}
                  href={item.to}
                  className={`rounded-lg px-3 py-2 transition-colors ${
                    isActive(item.to) ? 'bg-slate-900 text-sky-300' : 'hover:bg-slate-900'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ),
            )}
            <div className="mt-3 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={onSignIn}
              >
                Login
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={isAuthenticated ? onSignOut : onSignIn}
              >
                {isAuthenticated ? 'Dashboard' : 'Join Waitlist'}
              </Button>
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}

export const SiteHeader = memo(SiteHeaderComponent)
