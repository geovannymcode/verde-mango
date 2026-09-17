import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
export function RecipeSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div aria-label="Cargando recetas" role="status" className="space-y-6">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
    </div>
  )
}
export function RecipeError({
  retry,
  message = 'No pudimos cargar las recetas.',
}: {
  retry: () => void
  message?: string
}) {
  return (
    <div role="alert" className="space-y-3 rounded-vm-lg bg-vm-cream p-6">
      <p>{message}</p>
      <Button variant="outline" onClick={retry}>
        Reintentar
      </Button>
    </div>
  )
}
