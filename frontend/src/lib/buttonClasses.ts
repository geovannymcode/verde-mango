export type ButtonVariant = 'solid-orange' | 'solid-green' | 'outline' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

const variantClasses: Record<ButtonVariant, string> = {
  'solid-orange': 'bg-vm-orange text-vm-white border border-transparent hover:bg-vm-orange/90',
  'solid-green': 'bg-vm-green text-vm-ink border border-transparent hover:bg-vm-green/90',
  outline: 'bg-transparent text-vm-ink border border-vm-line hover:border-vm-ink',
  ghost: 'bg-transparent text-vm-ink border border-transparent hover:bg-vm-cream',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-[15px]',
  lg: 'h-[52px] px-8 text-base',
}

export function buttonClasses(
  variant: ButtonVariant = 'solid-orange',
  size: ButtonSize = 'md',
  className = '',
): string {
  return `inline-flex items-center justify-center gap-2 rounded-vm-full font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`
}
