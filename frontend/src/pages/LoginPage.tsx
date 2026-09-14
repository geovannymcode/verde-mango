import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLogin } from '@/features/auth/hooks'
import { loginSchema, type LoginFormValues } from '@/lib/validators'
import { useUiStore } from '@/store/uiStore'
import { ApiError } from '@/api/types'
import { SectionTitle } from '@/components/layout/SectionTitle'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const pushToast = useUiStore((state) => state.pushToast)
  const login = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const from =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/cuenta'

  function submit(values: LoginFormValues) {
    login.mutate(values, {
      onSuccess: () => {
        navigate(from, { replace: true })
      },
      onError: (error) => {
        const message = error instanceof ApiError ? error.message : 'No pudimos iniciar sesión.'
        pushToast({ message, variant: 'error' })
      },
    })
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-8 px-4 py-16 sm:px-6">
      <SectionTitle align="center" eyebrow="bienvenido" title="Iniciar sesión" />

      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
        <Input
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          {...register('email')}
          error={errors.email?.message}
        />
        <Input
          label="Contraseña"
          type="password"
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
  )
}
