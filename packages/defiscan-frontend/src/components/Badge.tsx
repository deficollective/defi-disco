import { clsx } from 'clsx'
import { adminTypeBgClass } from '../utils/colors'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'admin-type' | 'governance' | 'purple'
  adminType?: string
  className?: string
}

export function Badge({
  children,
  variant = 'default',
  adminType,
  className,
}: BadgeProps) {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium tracking-wide'

  const variantClass =
    variant === 'admin-type' && adminType
      ? adminTypeBgClass(adminType)
      : variant === 'governance'
        ? 'bg-status-green/10 text-status-green'
        : variant === 'purple'
          ? 'bg-brand-50 text-brand-700'
          : 'bg-bg-muted text-text-secondary'

  return <span className={clsx(base, variantClass, className)}>{children}</span>
}
