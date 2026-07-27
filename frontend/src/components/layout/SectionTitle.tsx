interface SectionTitleProps {
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
  className?: string
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  align = 'left',
  className = '',
}: SectionTitleProps) {
  if (align === 'center') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <span
          aria-hidden
          className="mb-3 h-1.5 w-12 rounded-vm-full bg-gradient-to-r from-vm-orange to-vm-green"
        />
        {eyebrow && <p className="font-hand text-xl text-vm-orange">{eyebrow}</p>}
        <h2 className="text-2xl font-bold text-vm-ink sm:text-3xl">{title}</h2>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-vm-muted sm:text-base">{description}</p>
        )}
      </div>
    )
  }

  return (
    <div className={`flex gap-4 ${className}`}>
      <span
        aria-hidden
        className="mt-1 h-12 w-1.5 shrink-0 rounded-vm-full bg-gradient-to-b from-vm-orange to-vm-green"
      />
      <div>
        {eyebrow && <p className="font-hand text-xl text-vm-orange">{eyebrow}</p>}
        <h2 className="text-2xl font-bold text-vm-ink sm:text-3xl">{title}</h2>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-vm-muted sm:text-base">{description}</p>
        )}
      </div>
    </div>
  )
}
