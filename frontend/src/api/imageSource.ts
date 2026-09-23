import { z } from 'zod'
export const imageUrlSchema = z.string().trim().url('Escribe una URL válida.').refine(url => /^https?:\/\//i.test(url), 'Usa una URL HTTP o HTTPS.')
/** The backend accepts URLs, not files. Verify that the browser can decode the source. */
export async function prepareImageSource(value: string): Promise<string> {
  const url = imageUrlSchema.parse(value)
  await new Promise<void>((resolve, reject) => {
    const image = new Image()
    const finish = (error?: Error) => {
      window.clearTimeout(timer)
      image.onload = null
      image.onerror = null
      if (error) reject(error)
      else resolve()
    }
    const timer = window.setTimeout(() => finish(new Error('La imagen tardó demasiado en cargar. Revisa la URL.')), 10000)
    image.referrerPolicy = 'no-referrer'
    image.onload = () => finish()
    image.onerror = () => finish(new Error('No se pudo cargar la imagen. Usa una URL pública de imagen.'))
    image.src = url
  })
  return url
}
