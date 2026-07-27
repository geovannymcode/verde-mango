import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  to?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  return (
    <nav aria-label="Migas de pan" className={`flex items-center gap-1.5 text-sm ${className}`}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 && <ChevronRight size={14} className="text-vm-muted" aria-hidden />}
            {item.to && !isLast ? (
              <Link to={item.to} className="text-vm-muted hover:text-vm-orange">
                {item.label}
              </Link>
            ) : (
              <span aria-current={isLast ? 'page' : undefined} className="text-vm-ink font-medium">
                {item.label}
              </span>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}
