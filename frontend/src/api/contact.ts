import { z } from 'zod'

export const contactSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, 'Escribe tu nombre completo (mínimo 3 caracteres).')
    .max(120, 'El nombre no puede superar 120 caracteres.')
    .refine((value) => value.split(/\s+/).length >= 2, 'Incluye tu nombre y apellido.'),
  email: z
    .string()
    .trim()
    .min(1, 'Escribe tu correo electrónico.')
    .email('Escribe un correo electrónico válido.')
    .max(254, 'El correo no puede superar 254 caracteres.'),
  subject: z
    .string()
    .trim()
    .min(3, 'El asunto debe tener al menos 3 caracteres.')
    .max(150, 'El asunto no puede superar 150 caracteres.'),
  comments: z
    .string()
    .trim()
    .min(10, 'Escribe un mensaje de al menos 10 caracteres.')
    .max(3000, 'El mensaje no puede superar 3000 caracteres.'),
  website: z
    .string()
    .max(0, 'No pudimos validar el formulario. Recarga la página e inténtalo de nuevo.'),
  renderedAt: z.number().finite().positive('No pudimos validar el formulario. Recarga la página.'),
})
export type ContactFormValues = z.infer<typeof contactSchema>
export class ContactError extends Error {
  readonly code: 'unavailable' | 'too_fast' | 'invalid'
  constructor(message: string, code: 'unavailable' | 'too_fast' | 'invalid') {
    super(message)
    this.name = 'ContactError'
    this.code = code
  }
}
export const contactAvailability: { enabled: boolean; message: string } = {
  enabled: false,
  message:
    'El envío de mensajes todavía no está disponible. Puedes completar el formulario, pero tu mensaje no se enviará.',
}

// Único punto de integración. No existe endpoint ni DTO de contacto en el backend revisado.
// TODO: Cuando exista el contrato, mapear estos campos al DTO y realizar aquí la petición real.
// Cambiar también contactAvailability; la página ya maneja éxito, error y estado pendiente.
export async function sendContactMessage(input: ContactFormValues): Promise<void> {
  const result = contactSchema.safeParse(input)
  if (!result.success)
    throw new ContactError(
      result.error.issues[0]?.message ?? 'Revisa los campos del formulario.',
      'invalid',
    )
  const elapsed = Date.now() - result.data.renderedAt
  if (elapsed < 2000)
    throw new ContactError('Espera al menos 2 segundos antes de enviar el formulario.', 'too_fast')
  throw new ContactError(contactAvailability.message, 'unavailable')
}
