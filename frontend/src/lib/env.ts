export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  wompiPublicKey: import.meta.env.VITE_WOMPI_PUBLIC_KEY ?? '',
} as const
