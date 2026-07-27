import { Link } from 'react-router-dom'
import { mockCategories, mockProducts, mockRecipes } from '@/lib/mocks'
import { buttonClasses } from '@/lib/buttonClasses'
import { SectionTitle } from '@/components/layout/SectionTitle'
import { ProductGrid } from '@/components/catalog/ProductGrid'
import { RecipeCard } from '@/components/recipes/RecipeCard'

export function HomePage() {
  const featuredProducts = mockProducts.slice(0, 8)
  const recentRecipes = mockRecipes.slice(0, 3)

  return (
    <div className="flex flex-col gap-16 pb-16 sm:gap-20">
      <section className="bg-vm-cream">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:py-20">
          <div className="flex flex-col items-center gap-4 text-center md:items-start md:text-left">
            <p className="font-hand text-2xl text-vm-orange">frescura de la huerta</p>
            <h1 className="text-3xl font-extrabold leading-tight text-vm-ink sm:text-4xl md:text-5xl">
              Fermentos, veg-quesos y recetas 100% veganas
            </h1>
            <p className="max-w-md text-vm-muted sm:text-lg">
              Productos hechos a mano con ingredientes de la huerta, listos para llevar a tu mesa.
            </p>
            <div className="flex flex-wrap justify-center gap-3 md:justify-start">
              <Link to="/productos" className={buttonClasses('solid-orange', 'lg')}>
                Ver tienda
              </Link>
              <Link to="/recetas" className={buttonClasses('outline', 'lg')}>
                Ver recetas
              </Link>
            </div>
          </div>
          <img
            src="https://picsum.photos/seed/vm-hero/640/520"
            alt="Selección de productos Verde Mango"
            className="mx-auto w-full max-w-md rounded-vm-lg object-cover shadow-vm-card"
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionTitle eyebrow="explora" title="Categorías destacadas" />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {mockCategories.map((category) => (
            <Link
              key={category.id}
              to={`/productos?categoria=${category.slug}`}
              className="group flex flex-col items-center gap-3 rounded-vm-lg border border-vm-line bg-vm-white p-4 text-center transition-shadow hover:shadow-vm-card"
            >
              <img
                src={category.image}
                alt={category.name}
                className="h-20 w-20 rounded-vm-full object-cover transition-transform group-hover:scale-105"
              />
              <span className="text-sm font-semibold text-vm-ink">{category.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionTitle
          eyebrow="lo más pedido"
          title="Productos destacados"
          description="Una selección de nuestros fermentos, veg-quesos y frescos favoritos."
        />
        <div className="mt-6">
          <ProductGrid products={featuredProducts} />
        </div>
        <div className="mt-8 flex justify-center">
          <Link to="/productos" className={buttonClasses('outline', 'md')}>
            Ver todos los productos
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionTitle
          eyebrow="para cocinar"
          title="Recetas recientes"
          description="Ideas fáciles y sabrosas para tu semana."
        />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {recentRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </section>

      <section className="bg-vm-cream">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-2">
          <img
            src="https://picsum.photos/seed/vm-story/640/480"
            alt="Nuestra historia"
            className="w-full rounded-vm-lg object-cover shadow-vm-card"
          />
          <div>
            <SectionTitle eyebrow="nuestra historia" title="De la huerta a tu mesa" />
            <p className="mt-4 text-vm-muted">
              Verde Mango nació de las ganas de compartir alimentos veganos hechos con procesos
              artesanales: fermentación lenta, ingredientes locales y mucho cariño. Creemos en una
              cocina que respeta la tierra y a quienes la habitan.
            </p>
            <Link to="/nosotros" className={`${buttonClasses('ghost', 'md')} mt-4`}>
              Conoce más
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
