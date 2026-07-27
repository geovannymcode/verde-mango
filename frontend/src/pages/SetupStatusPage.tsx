import { useQuery } from '@tanstack/react-query'
import { env } from '@/lib/env'

async function checkBackendHealth(): Promise<{ status: string }> {
  const response = await fetch(`${import.meta.env.DEV ? '' : env.apiBaseUrl}/actuator/health`)
  if (!response.ok) {
    throw new Error('El backend no respondió correctamente')
  }
  return response.json() as Promise<{ status: string }>
}

export function SetupStatusPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: checkBackendHealth,
  })

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-vm-cream px-4 text-center">
      <p className="font-hand text-2xl text-vm-orange">— est. 1998 —</p>
      <h1 className="text-4xl text-vm-ink">Verde Mango</h1>
      <p className="max-w-md text-vm-muted">
        Fase 1 completada: Vite + React 19 + TypeScript, Tailwind CSS, TanStack Query, Zustand y
        el cliente Axios están configurados.
      </p>
      <div className="rounded border border-vm-line bg-vm-white px-6 py-4 text-sm">
        <p className="font-semibold text-vm-ink">Estado del backend</p>
        {isLoading && <p className="text-vm-muted">Consultando {env.apiBaseUrl}/actuator/health…</p>}
        {isError && <p className="text-vm-orange">No fue posible conectar con el backend.</p>}
        {data && <p className="text-vm-green">{data.status}</p>}
      </div>
    </main>
  )
}
