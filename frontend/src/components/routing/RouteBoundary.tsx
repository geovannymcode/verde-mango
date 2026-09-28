import { Component, Suspense, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'

class ChunkErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed)
      return (
        <section role="alert" className="mx-auto max-w-3xl space-y-4 px-4 py-12">
          <h1 className="text-2xl font-bold">No pudimos cargar esta página</h1>
          <p>Comprueba tu conexión y recarga para obtener la versión actual del sitio.</p>
          <Button onClick={() => window.location.reload()}>Recargar página</Button>
        </section>
      )
    return this.props.children
  }
}

export function RouteBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  return (
    <ChunkErrorBoundary key={pathname}>
      <Suspense
        fallback={
          <section
            role="status"
            aria-label="Cargando página"
            className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10"
          >
            <span className="sr-only">Cargando página…</span>
            <div aria-hidden="true" className="space-y-6">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </section>
        }
      >
        {children}
      </Suspense>
    </ChunkErrorBoundary>
  )
}
