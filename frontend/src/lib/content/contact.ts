export type SocialNetwork = 'instagram' | 'facebook' | 'youtube' | 'linkedin'
export interface SocialLink {
  network: SocialNetwork
  label: string
  url: string | null
}
export const socialPlaceholders: SocialLink[] = [
  { network: 'instagram', label: 'Instagram', url: null },
  { network: 'facebook', label: 'Facebook', url: null },
  { network: 'youtube', label: 'YouTube', url: null },
  { network: 'linkedin', label: 'LinkedIn', url: null },
]
interface ContactContent {
  title: string
  description: string
  address: string
  phone: { display: string; href: string | null }
  email: { display: string; href: string | null }
  socials: SocialLink[]
  map: { embedUrl: string | null; title: string; pendingText: string }
}
// Dirección proporcionada por el propietario en esta fase.
// TODO: Completar el teléfono colombiano de la sede real.
// TODO: Completar email y URLs oficiales. Los enlaces sin datos permanecen deshabilitados.
// Google Maps busca la dirección proporcionada. TODO: Verificar el pin y sustituir por el embed oficial del negocio si es necesario.
export const contactContent: ContactContent = {
  title: 'Contáctenos',
  description: 'Las buenas conversaciones también alimentan. Cuéntanos qué tienes en mente.',
  address: 'Calle 112 # 43 - 123, Alameda del Río, Barranquilla, Colombia',
  phone: { display: '+57 · Teléfono por confirmar', href: null },
  email: { display: 'Correo por confirmar', href: null },
  socials: socialPlaceholders.map((social) => ({ ...social })),
  map: {
    embedUrl:
      'https://www.google.com/maps/embed?origin=mfe&pb=!1m2!2m1!1sCalle+112+%23+43+-+123,+Alameda+del+Rio,+Barranquilla,+Colombia',
    title: 'Mapa de Verde Mango: Calle 112 # 43 - 123, Alameda del Río, Barranquilla, Colombia',
    pendingText: 'Pronto compartiremos la ubicación de nuestra sede en Colombia.',
  },
}
