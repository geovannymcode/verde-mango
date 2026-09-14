// Ver docs/api-gaps.md ("Fase 4 — No existe integración real con Wompi en el backend") para el
// detalle completo. El backend actual NUNCA devuelve `paymentUrl` (siempre `null`) ni implementa
// un webhook/retorno real de Wompi. Todo lo de este archivo es el contrato ASUMIDO del Web
// Checkout de Wompi, pendiente de verificar contra una integración real.

export type WompiTransactionStatus = 'APPROVED' | 'DECLINED' | 'PENDING' | 'ERROR' | 'VOIDED'

export interface WompiReturnParams {
  transactionId: string | null
  reference: string | null
  status: WompiTransactionStatus | null
}

const KNOWN_STATUSES: WompiTransactionStatus[] = [
  'APPROVED',
  'DECLINED',
  'PENDING',
  'ERROR',
  'VOIDED',
]

export function parseWompiReturnParams(searchParams: URLSearchParams): WompiReturnParams {
  const rawStatus = searchParams.get('status')?.toUpperCase() ?? null
  const status = KNOWN_STATUSES.includes(rawStatus as WompiTransactionStatus)
    ? (rawStatus as WompiTransactionStatus)
    : null

  return {
    transactionId: searchParams.get('id'),
    reference: searchParams.get('reference'),
    status,
  }
}

export function redirectToWompiCheckout(paymentUrl: string): void {
  window.location.href = paymentUrl
}
