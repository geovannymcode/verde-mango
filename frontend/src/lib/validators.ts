import { z } from 'zod'

export const createRatingSchema = z.object({
  rating: z
    .number({ error: 'Selecciona una calificación' })
    .int()
    .min(1, 'La calificación mínima es 1 estrella')
    .max(5, 'La calificación máxima es 5 estrellas'),
  title: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  comment: z
    .string()
    .min(10, 'El comentario debe tener al menos 10 caracteres')
    .max(1000, 'El comentario no puede superar los 1000 caracteres'),
})

export type CreateRatingFormValues = z.infer<typeof createRatingSchema>

export const loginSchema = z.object({
  email: z.string().min(1, 'El correo es requerido').email('Correo inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

// Debe reflejar exactamente la regla del backend (RegisterRequest.password en
// auth/web/Dtos.kt): 8-100 caracteres, al menos una minúscula, una mayúscula y un dígito.
const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener entre 8 y 100 caracteres')
  .max(100, 'La contraseña debe tener entre 8 y 100 caracteres')
  .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Debe contener al menos una minúscula, una mayúscula y un dígito',
  })

export const registerSchema = z
  .object({
    firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
    lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').max(100),
    email: z.string().min(1, 'El correo es requerido').email('Correo inválido'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
    phone: z.string().max(20).optional().or(z.literal('')),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export type RegisterFormValues = z.infer<typeof registerSchema>

const addressSchema = z.object({
  recipientName: z.string().min(1, 'El nombre del destinatario es requerido').max(150),
  phone: z.string().min(1, 'El teléfono es requerido').max(20),
  streetAddress: z.string().min(1, 'La dirección es requerida').max(200),
  apartment: z.string().max(100).optional().or(z.literal('')),
  city: z.string().min(1, 'La ciudad es requerida').max(100),
  state: z.string().max(100).optional().or(z.literal('')),
  postalCode: z.string().max(20).optional().or(z.literal('')),
  country: z.string().min(1, 'El país es requerido').max(100),
  instructions: z.string().max(300).optional().or(z.literal('')),
})

export const checkoutSchema = z
  .object({
    shippingAddress: addressSchema,
    billingSameAsShipping: z.boolean(),
    billingAddress: addressSchema.optional(),
    billingTaxId: z.string().max(50).optional().or(z.literal('')),
    customerNotes: z.string().max(500).optional().or(z.literal('')),
    paymentMethod: z.string().min(1, 'Selecciona un método de pago'),
  })
  .refine(
    (values) => values.billingSameAsShipping || !!values.billingAddress,
    {
      message: 'La dirección de facturación es requerida',
      path: ['billingAddress'],
    },
  )

export type CheckoutFormValues = z.infer<typeof checkoutSchema>
