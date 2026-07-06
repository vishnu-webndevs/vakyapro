import { memo, createElement } from 'react'
import type { ReactNode } from 'react'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

type HeadingTagName = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

export interface BreadcrumbItem {
  label: string
  href?: string
  onClick?: () => void
  isCurrent?: boolean
}

export interface PageHeadingProps {
  title: string
  subtitle?: ReactNode
  level?: HeadingLevel
  breadcrumbs?: BreadcrumbItem[]
  actions?: ReactNode
  align?: 'left' | 'center'
}

function getHeadingTag(level: HeadingLevel): HeadingTagName {
  switch (level) {
    case 1:
      return 'h1'
    case 2:
      return 'h2'
    case 3:
      return 'h3'
    case 4:
      return 'h4'
    case 5:
      return 'h5'
    default:
      return 'h6'
  }
}

function PageHeadingComponent({
  title,
  subtitle,
  level = 1,
  breadcrumbs,
  actions,
  align = 'left',
}: PageHeadingProps) {
  const isCentered = align === 'center'

  return (
    <header
      className={`mb-6 flex flex-col gap-4 ${isCentered ? 'items-center text-center' : 'items-start text-left'} md:flex-row md:items-end md:justify-between md:gap-6`}
    >
      <div className="space-y-3">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-slate-400">
              {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1

                if (item.isCurrent || isLast) {
                  return (
                    <li key={item.label} aria-current="page" className="flex items-center gap-1">
                      {index > 0 && <span className="text-slate-600">/</span>}
                      <span className="font-medium text-slate-200">{item.label}</span>
                    </li>
                  )
                }

                const handleClick = () => {
                  if (item.onClick) {
                    item.onClick()
                  }
                }

                return (
                  <li key={item.label} className="flex items-center gap-1">
                    {index > 0 && <span className="text-slate-600">/</span>}
                    {item.href ? (
                      <a
                        href={item.href}
                        onClick={item.onClick ? handleClick : undefined}
                        className="hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-sm"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={item.onClick}
                        className="text-slate-300 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-sm"
                      >
                        {item.label}
                      </button>
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>
        )}

        <div>
          {createElement(
            getHeadingTag(level),
            { className: 'text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl' },
            title,
          )}
          {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
        </div>
      </div>

      {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}

export const PageHeading = memo(PageHeadingComponent)
