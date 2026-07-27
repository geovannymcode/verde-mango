import { useState, type ReactNode } from 'react'

export interface TabItem {
  id: string
  label: string
  content: ReactNode
}

interface TabsProps {
  tabs: TabItem[]
  defaultTabId?: string
  className?: string
}

export function Tabs({ tabs, defaultTabId, className = '' }: TabsProps) {
  const [activeId, setActiveId] = useState(defaultTabId ?? tabs[0]?.id)
  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0]

  return (
    <div className={className}>
      <div role="tablist" aria-label="Secciones" className="flex gap-6 border-b border-vm-line">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === activeTab?.id}
            onClick={() => setActiveId(tab.id)}
            className={`-mb-px border-b-2 px-1 py-3 text-sm font-semibold uppercase tracking-wide transition-colors ${
              tab.id === activeTab?.id
                ? 'border-vm-orange text-vm-orange'
                : 'border-transparent text-vm-muted hover:text-vm-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="py-6">
        {activeTab?.content}
      </div>
    </div>
  )
}
