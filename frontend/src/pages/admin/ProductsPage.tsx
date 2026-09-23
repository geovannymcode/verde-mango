import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ProductResponse } from '@/api/schema'
import { useAdminProducts, useAdminCategories } from '@/features/admin/catalogHooks'
import { useUrlFilters } from '@/hooks/useUrlFilters'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { DataTable, type DataColumn } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { DeleteProductDialog } from '@/components/admin/DeleteProductDialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/formatters'
import { adminErrorMessage } from '@/lib/adminErrors'
type SortKey = 'name' | 'price' | 'stock'
export function ProductsPage() {
  useDocumentTitle('Productos | Administración', 'Administra el catálogo de Verde Mango.')
  const filters = useUrlFilters()
  const rawSort = filters.searchParams.get('orden')
  const sortBy: SortKey = rawSort === 'price' || rawSort === 'stock' ? rawSort : 'name'
  const sortDir = filters.searchParams.get('direccion') === 'desc' ? 'desc' : 'asc'
  const rawCategory = Number(filters.searchParams.get('categoria'))
  const state = filters.searchParams.get('estado') ?? ''
  const query = useAdminProducts({ search: filters.q || undefined, categoryId: rawCategory > 0 ? rawCategory : undefined, active: state === 'activo' ? true : state === 'inactivo' ? false : undefined, page: filters.page - 1, size: 10, sortBy, sortDir })
  const categories = useAdminCategories()
  const [deleting, setDeleting] = useState<ProductResponse | null>(null)
  const columns: DataColumn<ProductResponse, SortKey>[] = [
    { id: 'image', header: 'Imagen', cell: row => row.primaryImageUrl ? <img src={row.primaryImageUrl} alt="" loading="lazy" className="aspect-square w-12 min-w-12 rounded object-cover" /> : '—' },
    { id: 'name', header: 'Nombre', sortKey: 'name', cell: row => <Link className="font-semibold hover:underline" to={`/admin/productos/${row.id}/editar`}>{row.name}</Link> },
    { id: 'category', header: 'Categoría', cell: row => row.category?.name ?? 'Sin categoría' },
    { id: 'price', header: 'Precio', sortKey: 'price', cell: row => formatCurrency(row.price) },
    { id: 'stock', header: 'Stock', sortKey: 'stock', cell: row => <span className={row.stock === 0 ? 'font-bold text-red-700' : row.isLowStock ? 'font-semibold text-amber-800' : ''}>{row.stock}{row.stock === 0 ? ' · Agotado' : row.isLowStock ? ' · Bajo' : ''}</span> },
    { id: 'featured', header: 'Destacado', cell: row => row.featured ? 'Sí' : 'No' },
    { id: 'active', header: 'Estado', cell: row => <StatusBadge status={row.active ? 'ACTIVE' : 'INACTIVE'} /> },
    { id: 'actions', header: 'Acciones', cell: row => <div className="flex items-center gap-3"><Link className="underline" to={`/admin/productos/${row.id}/editar`}>Editar</Link><Button size="sm" variant="outline" onClick={() => setDeleting(row)}>Eliminar</Button></div> },
  ]
  const create = <Link to="/admin/productos/nuevo" className="inline-flex rounded-md bg-vm-orange px-4 py-3 text-sm font-semibold text-white">Crear producto</Link>
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-2xl font-bold">Productos</h1>{create}</div>
    <div className="grid items-end gap-4 lg:grid-cols-4">
      <Input id="product-search" label="Buscar por nombre" value={filters.searchInput} onChange={e => filters.setSearchInput(e.target.value)} placeholder="Nombre del producto" />
      <Select id="product-category" label="Categoría" value={filters.searchParams.get('categoria') ?? ''} onChange={e => filters.updateParams({ categoria: e.target.value })}><option value="">Todas</option>{categories.data?.map(category => <option key={category.id} value={category.id}>{category.name}{category.active ? '' : ' (inactiva)'}</option>)}</Select>
      <Select id="product-state" label="Estado" value={state} onChange={e => filters.updateParams({ estado: e.target.value })}><option value="">Todos</option><option value="activo">Activo</option><option value="inactivo">Inactivo</option></Select>
      <Button variant="outline" onClick={filters.clearFilters}>Limpiar filtros</Button>
    </div>
    {categories.error && <div role="alert">{adminErrorMessage(categories.error)} <Button variant="outline" onClick={() => void categories.refetch()}>Reintentar categorías</Button></div>}
    <DataTable caption="Productos" columns={columns} rows={query.data?.content ?? []} rowKey={row => row.id} rowClassName={row => row.stock === 0 ? 'bg-red-50/50' : row.isLowStock ? 'bg-amber-50/50' : ''} pagination={{ page: filters.page, size: 10, totalElements: query.data?.totalElements ?? 0, totalPages: query.data?.totalPages ?? 0 }} onPageChange={page => filters.updateParams({ page: String(page) }, false)} sort={{ key: sortBy, direction: sortDir }} onSortChange={sort => filters.updateParams({ orden: sort.key, direccion: sort.direction })} isLoading={query.isPending} isFetching={query.isFetching} error={query.error} onRetry={() => void query.refetch()} emptyMessage="No hay productos que coincidan con los filtros." emptyAction={create} />
    {deleting && <DeleteProductDialog product={deleting} onClose={() => setDeleting(null)} />}
  </div>
}
