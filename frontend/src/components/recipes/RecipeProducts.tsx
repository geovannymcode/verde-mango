import { useQuery } from '@tanstack/react-query'
import { getProductById } from '@/api/catalog'
import { catalogKeys } from '@/features/catalog/keys'
import type { RecipeIngredientResponse } from '@/api/schema'
import { ProductCard } from '@/components/catalog/ProductCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { RecipeError } from './RecipeQueryState'
function IngredientProduct({ id }: { id: number }) {
  const query = useQuery({
    queryKey: [...catalogKeys.products(), 'by-id', id],
    queryFn: () => getProductById(id),
  })
  if (query.isPending) return <Skeleton className="aspect-square w-full" />
  if (query.isError)
    return (
      <RecipeError
        message="No pudimos cargar este ingrediente del catálogo."
        retry={() => void query.refetch()}
      />
    )
  const product = query.data
  return (
    <ProductCard
      product={{
        id: product.id,
        name: product.name,
        slug: product.slug,
        category: product.category?.name,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        image: product.primaryImageUrl,
        rating: product.averageRating,
        reviewCount: product.ratingCount,
        inStock: product.isInStock,
      }}
    />
  )
}
export function RecipeProducts({ ingredients }: { ingredients: RecipeIngredientResponse[] }) {
  const ids = [
    ...new Set(
      ingredients.flatMap((ingredient) =>
        ingredient.productId != null ? [ingredient.productId] : [],
      ),
    ),
  ]
  if (!ids.length) return null
  return (
    <section>
      <h2 className="mb-5 text-2xl font-bold">Consigue los ingredientes</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ids.map((id) => (
          <IngredientProduct key={id} id={id} />
        ))}
      </div>
    </section>
  )
}
