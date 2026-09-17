// Se muestra mientras `useAuthBootstrap` intenta restaurar la sesión desde el refresh token
// (status === 'loading'). Evita el parpadeo de mostrar /login a un usuario que sí tiene sesión.
export function SplashScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-vm-cream">
      <span className="text-2xl font-extrabold text-vm-ink">
        Verde<span className="text-vm-orange">Mango</span>
      </span>
      <div
        role="status"
        aria-label="Cargando"
        className="h-8 w-8 animate-spin rounded-full border-2 border-vm-orange border-t-transparent"
      />
    </div>
  )
}
