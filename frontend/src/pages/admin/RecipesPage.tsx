import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DataTable, type DataColumn } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useUrlFilters } from '@/hooks/useUrlFilters'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useRecipeCategories } from '@/features/recipes/hooks'
import { useAdminRecipes, useDeleteRecipe } from '@/features/admin/recipes/hooks'
import type { AdminRecipeParams, RecipeListItem } from '@/api/adminRecipes'
import { adminErrorMessage } from '@/lib/adminErrors'
export function AdminRecipesPage() {
  useDocumentTitle('Recetas · Administración', 'Crea y publica recetas de Verde Mango.')
  const f = useUrlFilters(),
    categories = useRecipeCategories()
  const rawStatus = f.searchParams.get('estado'),
    rawDifficulty = f.searchParams.get('dificultad'),
    categoryId = Number(f.searchParams.get('categoria'))
  const params: AdminRecipeParams = {
    search: f.q || undefined,
    page: f.page - 1,
    size: 20,
    status:
      rawStatus === 'DRAFT' || rawStatus === 'PUBLISHED' || rawStatus === 'ARCHIVED'
        ? rawStatus
        : undefined,
    difficulty:
      rawDifficulty === 'EASY' || rawDifficulty === 'MEDIUM' || rawDifficulty === 'HARD'
        ? rawDifficulty
        : undefined,
    categoryId: categoryId > 0 ? categoryId : undefined,
  }
  const query = useAdminRecipes(params),
    remove = useDeleteRecipe()
  const [deleting, setDeleting] = useState<RecipeListItem>()
  const columns: DataColumn<RecipeListItem>[] = [
    {
      id: 'image',
      header: 'Imagen',
      cell: (r) => (
        <img
          loading="lazy"
          alt=""
          src={r.primaryImageUrl || '/placeholder-product.svg'}
          className="h-14 w-20 rounded object-cover"
        />
      ),
    },
    {
      id: 'title',
      header: 'Título',
      cell: (r) => (
        <Link to={`/admin/recetas/${r.id}/editar`} className="font-semibold text-vm-orange">
          {r.title}
        </Link>
      ),
    },
    { id: 'category', header: 'Categoría', cell: (r) => r.category?.name ?? 'Sin categoría' },
    { id: 'difficulty', header: 'Dificultad', cell: (r) => r.difficultyLabel },
    { id: 'time', header: 'Tiempo total', cell: (r) => r.totalTimeFormatted },
    { id: 'status', header: 'Estado', cell: (r) => <StatusBadge status={r.status} /> },
    {
      id: 'actions',
      header: 'Acciones',
      cell: (r) => (
        <div className="flex gap-3">
          <Link to={`/admin/recetas/${r.id}/editar`}>Editar</Link>
          <button
            type="button"
            className="text-red-700"
            onClick={() => {
              remove.reset()
              setDeleting(r)
            }}
          >
            Eliminar
          </button>
        </div>
      ),
    },
  ]
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Recetas</h1>
        <Link className="rounded-md bg-vm-orange px-5 py-3 text-white" to="/admin/recetas/nueva">
          Crear receta
        </Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        <Input
          id="recipe-search"
          label="Buscar por título"
          value={f.searchInput}
          onChange={(e) => f.setSearchInput(e.target.value)}
        />
        <Select
          id="recipe-category-filter"
          label="Categoría"
          value={f.searchParams.get('categoria') ?? ''}
          onChange={(e) => f.updateParams({ categoria: e.target.value })}
        >
          <option value="">Todas</option>
          {categories.data
            ?.flatMap((c) => [c, ...c.children])
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </Select>
        <Select
          id="recipe-difficulty-filter"
          label="Dificultad"
          value={rawDifficulty ?? ''}
          onChange={(e) => f.updateParams({ dificultad: e.target.value })}
        >
          <option value="">Todas</option>
          <option value="EASY">Fácil</option>
          <option value="MEDIUM">Media</option>
          <option value="HARD">Difícil</option>
        </Select>
        <Select
          id="recipe-status-filter"
          label="Estado de publicación"
          value={rawStatus ?? ''}
          onChange={(e) => f.updateParams({ estado: e.target.value })}
        >
          <option value="">Todos</option>
          <option value="DRAFT">Borrador</option>
          <option value="PUBLISHED">Publicada</option>
          <option value="ARCHIVED">Archivada</option>
        </Select>
      </div>
      <Button variant="outline" onClick={f.clearFilters}>
        Limpiar filtros
      </Button>
      <DataTable
        caption="Recetas"
        columns={columns}
        rows={query.data?.content ?? []}
        rowKey={(r) => r.id}
        pagination={{
          page: f.page,
          size: 20,
          totalElements: query.data?.totalElements ?? 0,
          totalPages: query.data?.totalPages ?? 0,
        }}
        onPageChange={(p) => f.updateParams({ page: String(p) }, false)}
        isLoading={query.isLoading}
        isFetching={query.isFetching}
        error={query.error}
        onRetry={() => void query.refetch()}
        emptyMessage="No hay recetas con estos filtros."
        emptyAction={
          <Link to="/admin/recetas/nueva" className="text-vm-orange">
            Crear receta
          </Link>
        }
      />
      {deleting && (
        <ConfirmDialog
          open
          title="Eliminar receta"
          description={`Se eliminará «${deleting.title}» de forma permanente y dejará de aparecer en la web.`}
          requiredText={deleting.title}
          confirmText="Eliminar receta"
          pending={remove.isPending}
          error={remove.error ? adminErrorMessage(remove.error) : undefined}
          onCancel={() => setDeleting(undefined)}
          onConfirm={() => remove.mutate(deleting.id, { onSuccess: () => setDeleting(undefined) })}
        />
      )}
    </div>
  )
}
