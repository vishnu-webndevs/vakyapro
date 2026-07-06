import { memo } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode
  subtitle?: ReactNode
  headerRight?: ReactNode
  footer?: ReactNode
  interactive?: boolean
}

function CardComponent({
  title,
  subtitle,
  headerRight,
  footer,
  interactive,
  className,
  children,
  ...rest
}: CardProps) {
  const interactiveClasses = interactive
    ? 'hover:border-sky-500/70 hover:shadow-lg hover:shadow-sky-900/40 cursor-pointer'
    : ''

  return (
    <section
      className={`rounded-2xl border border-slate-800/80 bg-slate-900/70 p-5 text-slate-50 shadow-sm ${interactiveClasses} ${className ?? ''}`}
      {...rest}
    >
      {(title || subtitle || headerRight) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-sm font-semibold text-slate-100">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
          </div>
          {headerRight && <div className="shrink-0">{headerRight}</div>}
        </header>
      )}

      <div className="text-sm text-slate-100">{children}</div>

      {footer && <footer className="mt-4 border-t border-slate-800/80 pt-3 text-xs text-slate-400">{footer}</footer>}
    </section>
  )
}

export const Card = memo(CardComponent)
