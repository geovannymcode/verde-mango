import type { Location } from 'react-router-dom'

export function buildLoginRedirect(location: Location): string {
  const returnTo = `${location.pathname}${location.search}`
  return `/login?returnTo=${encodeURIComponent(returnTo)}`
}

// Solo se permiten rutas internas (empiezan con "/") para evitar open-redirects a través del
// query param `returnTo`.
export function resolveReturnTo(returnTo: string | null, fallback = '/'): string {
  if (
    returnTo &&
    returnTo.startsWith('/') &&
    !returnTo.startsWith('//') &&
    !returnTo.includes('\\') &&
    !Array.from(returnTo).some((char) => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127)
  ) {
    return returnTo
  }
  return fallback
}
