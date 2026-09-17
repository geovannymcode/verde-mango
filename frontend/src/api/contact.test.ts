import { afterEach, describe, expect, it, vi } from 'vitest'
import { contactSchema, sendContactMessage, type ContactFormValues } from './contact'
const now = 1_800_000_000_000
const valid: ContactFormValues = {
  fullName: 'Ana María',
  email: 'ana@example.com',
  subject: 'Una pregunta',
  comments: 'Quisiera conocer sus productos.',
  website: '',
  renderedAt: now - 3000,
}
afterEach(() => vi.restoreAllMocks())
describe('contact boundary', () => {
  it('validates required fields and limits with Spanish messages', () => {
    for (const input of [
      { fullName: 'Ana' },
      { email: 'invalid' },
      { subject: ' ' },
      { comments: 'corto' },
      { comments: 'a'.repeat(3001) },
    ]) {
      expect(contactSchema.safeParse({ ...valid, ...input }).success).toBe(false)
    }
    expect(contactSchema.parse({ ...valid, fullName: ' Ana María ' }).fullName).toBe('Ana María')
  })
  it('rejects the honeypot before any request', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(now)
    await expect(sendContactMessage({ ...valid, website: 'spam' })).rejects.toMatchObject({
      code: 'invalid',
    })
  })
  it.each([0, 1999, -1000])('rejects an elapsed time of %i ms', async (elapsed) => {
    vi.spyOn(Date, 'now').mockReturnValue(now)
    await expect(sendContactMessage({ ...valid, renderedAt: now - elapsed })).rejects.toMatchObject(
      { code: 'too_fast' },
    )
  })
  it('returns an honest unavailable error at 2 seconds instead of making a request', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(now)
    const fetch = vi.spyOn(globalThis, 'fetch')
    await expect(sendContactMessage({ ...valid, renderedAt: now - 2000 })).rejects.toMatchObject({
      code: 'unavailable',
    })
    expect(fetch).not.toHaveBeenCalled()
  })
})
