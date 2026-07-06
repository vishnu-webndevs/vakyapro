'use client'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, ChevronDown, LayoutDashboard, Menu, Settings, Users, FileText, X, MessageCircle, Film, GraduationCap, Tags, Sparkles } from 'lucide-react'
import { clearAdminToken, startAdminInactivityWatcher, stopAdminInactivityWatcher } from '../api/adminSession'

type AdminLayoutProps = {
  children: ReactNode
}

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Prompts', icon: FileText, path: '/admin/prompts' },
  { label: 'Pre-prompts', icon: Sparkles, path: '/admin/pre-prompts' },
  { label: 'Reels', icon: Film, path: '/admin/reels' },
  { label: 'Learn', icon: GraduationCap, path: '/admin/learn' },
  { label: 'Pricing', icon: FileText, path: '/admin/plans' },
  { label: 'Blogs', icon: FileText, path: '/admin/blogs' },
  { label: 'Blog Categories', icon: Tags, path: '/admin/blog-categories' },
  { label: 'Pages', icon: FileText, path: '/admin/pages' },
  { label: 'Chats', icon: MessageCircle, path: '/admin/chats' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    startAdminInactivityWatcher()
    return () => {
      stopAdminInactivityWatcher()
    }
  }, [])

  const handleLogout = () => {
    clearAdminToken()
    router.replace('/admin')
  }

  const renderNavItems = (isMobile: boolean) =>
    navItems.map((item) => {
      const Icon = item.icon
      const isActive = pathname === item.path

      return (
        <Link
          key={item.path}
          href={item.path}
          className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
            isActive
              ? 'bg-gradient-to-r from-sky-500/90 to-indigo-500/90 text-white shadow-lg shadow-sky-900/40'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
          }`}
          onClick={() => {
            if (isMobile) {
              setIsMobileSidebarOpen(false)
            }
          }}
        >
          <Icon className="h-4 w-4" />
          {!isSidebarCollapsed && <span>{item.label}</span>}
        </Link>
      )
    })

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex">
      <div
        className={`hidden lg:flex flex-col bg-slate-900/80 border-r border-slate-800/80 backdrop-blur-xl transition-all duration-300 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <img src="/Vakya-pro.png" alt="VakyaPro" width={48} height={48} className="h-12 w-12 rounded-xl object-cover" />
            {!isSidebarCollapsed && (
              <div>
               
                <div className="text-sm font-semibold text-slate-100">Admin Panel</div>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-100"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        <div className="px-3 py-2 space-y-1">{renderNavItems(false)}</div>

        <div className="mt-auto px-3 pb-4 pt-2">
          <button
            onClick={handleLogout}
            className="w-full rounded-xl border border-slate-700/80 px-3 py-2 text-xs font-medium text-slate-300 hover:border-rose-500/60 hover:text-rose-200 hover:bg-rose-950/40 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden">
          <div className="absolute inset-y-0 left-0 w-72 bg-slate-900 border-r border-slate-800 px-4 py-4 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <img src="/Vakya-pro.png" alt="VakyaPro" width={32} height={32} className="h-8 w-8 rounded-xl object-cover" />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    VakyaPro
                  </div>
                  <div className="text-sm font-semibold text-slate-100">Admin Panel</div>
                </div>
              </div>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1 mb-4">{renderNavItems(true)}</div>

            <button
              onClick={handleLogout}
              className="mt-auto rounded-xl border border-slate-700/80 px-3 py-2 text-xs font-medium text-slate-300 hover:border-rose-500/60 hover:text-rose-200 hover:bg-rose-950/40 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-xl px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:block">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Admin
              </div>
              <div className="text-sm font-semibold text-slate-100">
                {pathname === '/admin/dashboard' ? 'Overview' : 'Panel'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative rounded-xl border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-400 hover:border-sky-500/60 hover:text-sky-200 hidden md:flex items-center gap-2">
              <span>Prompt usage</span>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                Live
              </span>
            </button>
            <button className="relative rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-rose-500" />
            </button>
            <button className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/80 px-2 py-1.5 text-sm hover:border-sky-500/60">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-500 text-xs font-semibold text-white">
                SA
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-xs font-semibold text-slate-100">Super Admin</span>
                <span className="text-[10px] text-slate-400">Owner</span>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-500 hidden sm:block" />
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
