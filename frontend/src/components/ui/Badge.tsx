import type { HTMLAttributes } from 'react'

type BadgeVariant = 'orange' | 'green' | 'neutral' | 'danger'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  orange: 'bg-vm-orange/10 text-vm-orange',
  green: 'bg-vm-green/15 text-vm-green',
  neutral: 'bg-vm-cream text-vm-muted',
  danger: 'bg-red-50 text-red-500',
}

export function Badge({ variant = 'neutral', className = '', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-vm-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${variantClasses[variant]} ${className}`}
      {...props}
    />
  )
}
