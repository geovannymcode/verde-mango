import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useRegister } from '@/features/auth/hooks'
import { registerSchema, type RegisterFormValues } from '@/lib/validators'
import { resolveReturnTo } from '@/lib/returnTo'
import { ApiError } from '@/api/types'
import { SectionTitle } from '@/components/layout/SectionTitle'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'

// firstName, lastName, email, password calzan con los campos de RegisterRequest en el backend
// (auth/web/Dtos.kt); confirmPassword es solo del cliente.
const FIELD_NAMES = new Set<keyof RegisterFormValues>([
  'firstName',
  'lastName',
  'email',
  'password',
  'confirmPassword',
  'phone',
])

export function RegisterPage() {
  useDocumentTitle('Crear cuenta', 'Crea tu cuenta de Verde Mango para comprar y compartir tus valoraciones.')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const registerAccount = useRegister()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
    },
  })

  function submit(values: RegisterFormValues) {
    setFormError(null)
    registerAccount.mutate(
      {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        phone: values.phone || undefined,
      },
      {
        onSuccess: () => {
          navigate(resolveReturnTo(searchParams.get('returnTo')), { replace: true })
        },
        onError: (error) => {
          if (error instanceof ApiError && error.fieldErrors) {
            let mappedToField = false
            for (const [field, message] of Object.entries(error.fieldErrors)) {
              if (FIELD_NAMES.has(field as keyof RegisterFormValues)) {
                setError(field as keyof RegisterFormValues, { type: 'server', message })
                mappedToField = true
              }
            }
            if (!mappedToField) setFormError(error.message)
            return
          }
          setFormError(
            error instanceof ApiError ? error.message : 'No pudimos crear tu cuenta. Intenta de nuevo.',
          )
        },
      },
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-vm-cream px-4 py-16 sm:px-6">
      <div className="flex w-full max-w-md flex-col gap-8 rounded-vm-lg bg-vm-white p-8 shadow-sm">
        <Link to="/" className="flex flex-col items-center self-center leading-none">
          <span className="text-xl font-extrabold text-vm-ink">
            Verde<span className="text-vm-orange">Mango</span>
          </span>
          <span className="font-hand text-sm text-vm-green">vegan wonders</span>
        </Link>

        <SectionTitle align="center" eyebrow="únete" title="Crear cuenta" />

        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
          {formError && (
            <p role="alert" className="rounded-vm-md bg-red-50 px-4 py-3 text-sm text-red-600">
              {formError}
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" {...register('firstName')} error={errors.firstName?.message} />
            <Input label="Apellido" {...register('lastName')} error={errors.lastName?.message} />
          </div>
          <Input
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            {...register('email')}
            error={errors.email?.message}
          />
          <Input
            label="Teléfono (opcional)"
            type="tel"
            {...register('phone')}
            error={errors.phone?.message}
          />
          <PasswordInput
            label="Contraseña"
            autoComplete="new-password"
            {...register('password')}
            error={errors.password?.message}
          />
          <PasswordInput
            label="Confirmar contraseña"
            autoComplete="new-password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />
          <Button type="submit" disabled={registerAccount.isPending} className="mt-2">
            {registerAccount.isPending ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>
        </form>

        <p className="text-center text-sm text-vm-muted">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-vm-orange hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
