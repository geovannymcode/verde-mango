import { SectionTitle } from '@/components/layout/SectionTitle'

interface PlaceholderPageProps {
  eyebrow: string
  title: string
  description?: string
}

export function PlaceholderPage({ eyebrow, title, description }: PlaceholderPageProps) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-6xl flex-col items-center justify-center gap-4 px-4 py-20 text-center sm:px-6">
      <SectionTitle
        align="center"
        eyebrow={eyebrow}
        title={title}
        description={description ?? 'Esta sección está en construcción.'}
      />
    </div>
  )
}
