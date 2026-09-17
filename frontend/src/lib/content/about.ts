import { socialPlaceholders, type SocialLink } from './contact'
export interface Milestone {
  id: string
  year: string
  title: string
  description: string
}
export interface TeamMember {
  id: string
  name: string
  role: string
  photo: string
  photoAlt: string
  photoSource: string
  socials: SocialLink[]
}
export const aboutContent = {
  eyebrow: '— est. 1998 —',
  title: 'Nuestra Historia',
  subtitle:
    'De la huerta a la mesa, con tiempo y cariño.\nUna forma de cocinar que celebra lo natural.',
  watermark: 'verde mango',
  teamEyebrow: '— hard work —',
  teamTitle: 'Nuestro Equipo',
  teamDescription:
    'Manos que crean, cuidan y comparten. Conoce a quienes dan vida a nuestra cocina.',
  editorialNotice:
    'Una historia en construcción: estamos preparando los hitos y las presentaciones de nuestro equipo.',
}
// TODO: Validar la historia y sustituir las fechas/textos editoriales antes de publicar.
// 1998 es el año solicitado para el diseño; los demás años quedan pendientes, sin inventarlos.
export const milestones: Milestone[] = [
  {
    id: 'origen',
    year: '1998',
    title: 'Nuestra raíz',
    description:
      'El inicio de una historia que queremos contarte: nuestra relación con la tierra y los alimentos.',
  },
  {
    id: 'cocina',
    year: 'Por confirmar',
    title: 'Una cocina viva',
    description:
      'Fermentos y preparaciones vegetales que invitan a descubrir nuevos sabores, sin prisas.',
  },
  {
    id: 'comunidad',
    year: 'Por confirmar',
    title: 'Crecer en comunidad',
    description:
      'Productores, cocineros y personas que disfrutan compartir lo que llega a la mesa.',
  },
  {
    id: 'presente',
    year: 'Hoy',
    title: 'Seguimos cultivando',
    description:
      'Un espacio para explorar productos de la huerta, cocinar recetas y disfrutar cada ingrediente.',
  },
]
// TODO: Reemplazar nombres, cargos, fotos y redes con los del equipo real.
// Retratos de stock ilustrativos, NO representan integrantes de Verde Mango.
export const teamMembers: TeamMember[] = [
  {
    id: 'cocina',
    name: 'Nombre por confirmar',
    role: 'Cocina y recetas',
    photo:
      'https://images.pexels.com/photos/29654213/pexels-photo-29654213.jpeg?auto=compress&cs=tinysrgb&w=720',
    photoAlt: 'Retrato ilustrativo de una profesional de cocina',
    photoSource:
      'https://www.pexels.com/photo/professional-chef-portrait-in-culinary-studio-29654213/',
    socials: socialPlaceholders.map((social) => ({ ...social })),
  },
  {
    id: 'fermentos',
    name: 'Nombre por confirmar',
    role: 'Fermentación artesanal',
    photo:
      'https://images.pexels.com/photos/32224390/pexels-photo-32224390.jpeg?auto=compress&cs=tinysrgb&w=720',
    photoAlt: 'Retrato ilustrativo de un profesional de cocina',
    photoSource:
      'https://www.pexels.com/photo/professional-portrait-of-a-black-chef-in-dark-uniform-32224390/',
    socials: socialPlaceholders.map((social) => ({ ...social })),
  },
  {
    id: 'comunidad',
    name: 'Nombre por confirmar',
    role: 'Comunidad y servicio',
    photo:
      'https://images.pexels.com/photos/30952836/pexels-photo-30952836.jpeg?auto=compress&cs=tinysrgb&w=720',
    photoAlt: 'Retrato ilustrativo de una profesional de gastronomía',
    photoSource:
      'https://www.pexels.com/photo/confident-chef-in-professional-uniform-portrait-30952836/',
    socials: socialPlaceholders.map((social) => ({ ...social })),
  },
]
