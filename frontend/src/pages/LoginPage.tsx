import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useLogin } from '@/features/auth/hooks'
import { loginSchema, type LoginFormValues } from '@/lib/validators'
import { resolveReturnTo } from '@/lib/returnTo'
import { ApiError } from '@/api/types'
import { SectionTitle } from '@/components/layout/SectionTitle'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'

const FIELD_NAMES = new Set<keyof LoginFormValues>(['email', 'password'])

export function LoginPage() {
  useDocumentTitle('Iniciar sesión', 'Accede a tu cuenta de Verde Mango para consultar tus pedidos y completar tus compras.')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const login = useLogin()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  function submit(values: LoginFormValues) {
    setFormError(null)
    login.mutate(values, {
      onSuccess: () => {
        navigate(resolveReturnTo(searchParams.get('returnTo')), { replace: true })
      },
      onError: (error) => {
        if (error instanceof ApiError && error.fieldErrors) {
          let mappedToField = false
          for (const [field, message] of Object.entries(error.fieldErrors)) {
            if (FIELD_NAMES.has(field as keyof LoginFormValues)) {
              setError(field as keyof LoginFormValues, { type: 'server', message })
              mappedToField = true
            }
          }
          if (!mappedToField) setFormError(error.message)
          return
        }
        setFormError(
          error instanceof ApiError ? error.message : 'No pudimos iniciar sesión. Intenta de nuevo.',
        )
      },
    })
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

        <SectionTitle align="center" eyebrow="bienvenido" title="Iniciar sesión" />

        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
          {formError && (
            <p role="alert" className="rounded-vm-md bg-red-50 px-4 py-3 text-sm text-red-600">
              {formError}
            </p>
          )}
          <Input
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            {...register('email')}
            error={errors.email?.message}
          />
          <PasswordInput
            label="Contraseña"
            autoComplete="current-password"
            {...register('password')}
            error={errors.password?.message}
          />
          <Button type="submit" disabled={login.isPending} className="mt-2">
            {login.isPending ? 'Ingresando…' : 'Iniciar sesión'}
          </Button>
        </form>

        <p className="text-center text-sm text-vm-muted">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="font-semibold text-vm-orange hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}
