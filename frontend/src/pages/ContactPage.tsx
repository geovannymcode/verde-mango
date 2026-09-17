import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MapPin, Phone, Mail, Share2, LoaderCircle } from 'lucide-react'
import { SectionTitle } from '@/components/layout/SectionTitle'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { contactContent } from '@/lib/content/contact'
import {
  contactAvailability,
  contactSchema,
  sendContactMessage,
  type ContactFormValues,
} from '@/api/contact'
import { useUiStore } from '@/store/uiStore'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
const infoItems = [
  {
    key: 'address',
    title: 'Visítanos',
    icon: MapPin,
    color: '#eb6b35',
    value: contactContent.address,
    href: null,
  },
  {
    key: 'phone',
    title: 'Llámanos',
    icon: Phone,
    color: '#3b82a0',
    value: contactContent.phone.display,
    href: contactContent.phone.href,
  },
  {
    key: 'email',
    title: 'Escríbenos',
    icon: Mail,
    color: '#668b32',
    value: contactContent.email.display,
    href: contactContent.email.href,
  },
  { key: 'social', title: 'Síguenos', icon: Share2, color: '#ce9b2c', value: null, href: null },
]
function emptyForm(renderedAt: number): ContactFormValues {
  return { fullName: '', email: '', subject: '', comments: '', website: '', renderedAt }
}
export function ContactPage() {
  useDocumentTitle(
    'Contáctenos',
    'Conversa con Verde Mango. Consulta nuestros datos de contacto en Colombia y déjanos tus preguntas.',
  )
  const [renderedAt] = useState(() => Date.now())
  const pushToast = useUiStore((state) => state.pushToast)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: emptyForm(renderedAt),
  })
  async function submit(values: ContactFormValues) {
    try {
      await sendContactMessage(values)
      pushToast({ variant: 'success', message: 'Recibimos tu mensaje. Gracias por escribirnos.' })
      reset(emptyForm(renderedAt))
    } catch (error) {
      pushToast({
        variant: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'No pudimos enviar tu mensaje. Inténtalo de nuevo.',
      })
    }
  }
  return (
    <div>
      <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
        <div className="mb-14 text-center">
          <p className="font-hand text-2xl text-vm-orange">— conversemos —</p>
          <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">{contactContent.title}</h1>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-vm-muted">
            {contactContent.description}
          </p>
        </div>
        <div className="grid gap-14 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
          <section aria-label="Información de contacto" className="space-y-10">
            {infoItems.map(({ key, title, icon: Icon, color, value, href }) => (
              <div key={key} className="flex items-start gap-5">
                <div
                  className="contact-icon relative flex h-16 w-16 shrink-0 items-center justify-center"
                  style={{ color }}
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rotate-6 rounded-[46%_54%_48%_52%] border-[1.5px] border-current"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-1 -rotate-12 rounded-[53%_47%_56%_44%] border border-current opacity-30"
                  />
                  <Icon size={24} aria-hidden="true" />
                </div>
                <div className="min-w-0 pt-1">
                  <h2 className="text-lg font-bold">{title}</h2>
                  {value && (
                    <p className="mt-2 break-words text-sm leading-relaxed text-vm-muted">
                      {href ? (
                        <a href={href} className="hover:text-vm-orange">
                          {value}
                        </a>
                      ) : (
                        value
                      )}
                    </p>
                  )}
                  {key === 'social' && (
                    <>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {contactContent.socials.map((social) => {
                          const style =
                            'flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-vm-muted transition-colors hover:bg-vm-orange hover:text-white'
                          return social.url ? (
                            <a
                              key={social.network}
                              href={social.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={social.label}
                              className={style}
                            >
                              <svg width="16" height="16" aria-hidden="true">
                                <use href={`/icons.svg#vm-${social.network}`} />
                              </svg>
                            </a>
                          ) : (
                            <button
                              key={social.network}
                              type="button"
                              disabled
                              aria-label={`${social.label}: perfil por confirmar`}
                              title="Perfil por confirmar"
                              className={`${style} cursor-not-allowed`}
                            >
                              <svg width="16" height="16" aria-hidden="true">
                                <use href={`/icons.svg#vm-${social.network}`} />
                              </svg>
                            </button>
                          )
                        })}
                      </div>
                      <p className="mt-2 text-xs text-vm-muted">Perfiles por confirmar</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </section>
          <section>
            <SectionTitle
              title="Hablemos"
              description="¿Una pregunta, una idea o ganas de saber más? Te leemos."
            />
            {!contactAvailability.enabled && (
              <p
                id="contact-availability"
                role="note"
                className="mt-6 rounded-vm-md border border-vm-orange/25 bg-vm-cream p-4 text-sm leading-relaxed"
              >
                {contactAvailability.message}
              </p>
            )}
            <form
              onSubmit={handleSubmit(submit)}
              noValidate
              aria-label="Formulario de contacto"
              aria-busy={isSubmitting}
              aria-describedby={!contactAvailability.enabled ? 'contact-availability' : undefined}
              className="mt-6 space-y-5"
            >
              <Input
                label="Nombre completo"
                {...register('fullName')}
                autoComplete="name"
                maxLength={120}
                error={errors.fullName?.message}
                required
              />
              <Input
                label="Correo electrónico"
                {...register('email')}
                type="email"
                autoComplete="email"
                maxLength={254}
                error={errors.email?.message}
                required
              />
              <Input
                label="Asunto"
                {...register('subject')}
                maxLength={150}
                error={errors.subject?.message}
                required
              />
              <Textarea
                label="Comentarios"
                {...register('comments')}
                rows={6}
                maxLength={3000}
                error={errors.comments?.message}
                required
              />
              <div hidden aria-hidden="true">
                <label htmlFor="contact-website">No completar este campo</label>
                <input
                  id="contact-website"
                  {...register('website')}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
              <input type="hidden" {...register('renderedAt', { valueAsNumber: true })} />
              {(errors.website || errors.renderedAt) && (
                <p role="alert" className="text-sm text-red-500">
                  No pudimos validar el formulario. Recarga la página e inténtalo de nuevo.
                </p>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                aria-label={isSubmitting ? 'Enviando mensaje' : 'Enviar mensaje'}
                className="min-w-40 tracking-[0.25em]"
              >
                {isSubmitting && (
                  <LoaderCircle aria-hidden="true" size={18} className="animate-spin" />
                )}
                {isSubmitting ? 'ENVIANDO' : 'SEND'}
              </Button>
            </form>
          </section>
        </div>
      </div>
      <section aria-label="Ubicación de Verde Mango" className="w-full bg-vm-cream">
        <div className="px-6 py-4 text-center">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactContent.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-vm-ink underline underline-offset-4 hover:text-vm-orange"
          >
            Ver nuestra dirección en Google Maps
          </a>
        </div>
        {contactContent.map.embedUrl ? (
          <iframe
            src={contactContent.map.embedUrl}
            title={contactContent.map.title}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-[380px] w-full border-0"
          />
        ) : (
          <div className="flex h-[380px] flex-col items-center justify-center gap-4 px-6 text-center">
            <MapPin size={36} aria-hidden="true" className="text-vm-green" />
            <h2 className="text-2xl font-bold">Nos encontramos en Colombia</h2>
            <p className="max-w-lg text-vm-muted">{contactContent.map.pendingText}</p>
          </div>
        )}
      </section>
    </div>
  )
}
