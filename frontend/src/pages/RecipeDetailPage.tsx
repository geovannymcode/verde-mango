import { useParams } from 'react-router-dom'
import { PlaceholderPage } from '@/pages/PlaceholderPage'

export function RecipeDetailPage() {
  const { slug } = useParams()

  return (
    <PlaceholderPage
      eyebrow="receta"
      title={slug ? `Receta: ${slug}` : 'Detalle de receta'}
      description="Aquí verás los ingredientes, pasos y consejos de la receta."
    />
  )
}
