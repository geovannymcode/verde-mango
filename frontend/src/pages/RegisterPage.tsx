import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { useRegister } from '@/features/auth/hooks'
import { registerSchema, type RegisterFormValues } from '@/lib/validators'
import { useUiStore } from '@/store/uiStore'
import { ApiError } from '@/api/types'
import { SectionTitle } from '@/components/layout/SectionTitle'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function RegisterPage() {
  const navigate = useNavigate()
  const pushToast = useUiStore((state) => state.pushToast)
  const registerAccount = useRegister()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', phone: '' },
  })

  function submit(values: RegisterFormValues) {
    registerAccount.mutate(
      { ...values, phone: values.phone || undefined },
      {
        onSuccess: () => navigate('/cuenta', { replace: true }),
        onError: (error) => {
          const message = error instanceof ApiError ? error.message : 'No pudimos crear tu cuenta.'
          pushToast({ message, variant: 'error' })
        },
      },
    )
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-8 px-4 py-16 sm:px-6">
      <SectionTitle align="center" eyebrow="únete" title="Crear cuenta" />

      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
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
        <Input
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          {...register('password')}
          error={errors.password?.message}
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
  )
}
