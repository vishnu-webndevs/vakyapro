import { memo, forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
  isLoading?: boolean
}

const baseClasses =
  'inline-flex items-center justify-center rounded-lg font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 focus-visible:ring-offset-slate-950 disabled:opacity-60 disabled:cursor-not-allowed transition-colors'

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-xs gap-2',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-sky-500 to-indigo-500 text-white hover:from-sky-400 hover:to-indigo-400 border border-sky-400/40',
  secondary:
    'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-600/80',
  ghost:
    'bg-transparent text-slate-200 hover:bg-slate-800/70 border border-transparent',
}

const ButtonInner = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', leftIcon, rightIcon, fullWidth, isLoading, children, className, ...rest }, ref) => {
    const isDisabled = isLoading || rest.disabled
    const widthClass = fullWidth ? 'w-full' : ''
    const loadingLabel = typeof children === 'string' ? `Loading ${children}` : 'Loading'

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className ?? ''}`}
        aria-busy={isLoading ? 'true' : undefined}
        disabled={isDisabled}
        {...rest}
      >
        {isLoading && (
          <span
            className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-200 border-t-transparent"
            aria-hidden="true"
          />
        )}
        {leftIcon && !isLoading && <span className="mr-1.5 flex items-center">{leftIcon}</span>}
        <span>{isLoading ? loadingLabel : children}</span>
        {rightIcon && !isLoading && <span className="ml-1.5 flex items-center">{rightIcon}</span>}
      </button>
    )
  },
)

ButtonInner.displayName = 'Button'

export const Button = memo(ButtonInner)
