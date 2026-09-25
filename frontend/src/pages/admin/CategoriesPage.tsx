import { toSlug } from '@/lib/slug'
import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react'
import type { CatalogCategory } from '@/api/adminCatalog'
import { prepareImageSource } from '@/api/imageSource'
import {
  useAdminCategories,
  useSaveCategory,
  useDeleteCategory,
  useReorderCategories,
} from '@/features/admin/catalogHooks'
import { categorySchema, type CategoryFormValues } from '@/features/admin/catalogForms'
import { DataTable, type DataColumn } from '@/components/admin/DataTable'
import { FormShell } from '@/components/admin/FormShell'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { useUiStore } from '@/store/uiStore'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { adminErrorMessage, applyAdminFormError } from '@/lib/adminErrors'
function CategoryEditor({
  category,
  onClose,
}: {
  category?: CatalogCategory
  onClose: () => void
}) {
  const save = useSaveCategory()
  const manualSlug = useRef(Boolean(category))
  const [discard, setDiscard] = useState(false)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState<string>()
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? '',
      slug: category?.slug ?? '',
      description: category?.description ?? '',
      imageUrl: category?.imageUrl ?? '',
      sortOrder: category?.sortOrder ?? 0,
      active: category?.active ?? true,
    },
  })
  const pending = save.isPending || validating
  function close() {
    if (!pending && !discard) {
      if (form.formState.isDirty) setDiscard(true)
      else onClose()
    }
  }
  const fields = form.formState.errors
  const name = form.register('name')
  const slug = form.register('slug')
  return (
    <>
      <Modal open title={category ? 'Editar categoría' : 'Nueva categoría'} onClose={close}>
        <FormShell
          title={category ? category.name : 'Crear categoría'}
          isDirty={form.formState.isDirty}
          isSubmitting={pending}
          error={error}
          onCancel={close}
          onSubmit={form.handleSubmit(async (values) => {
            setError(undefined)
            try {
              if (values.imageUrl && values.imageUrl !== category?.imageUrl) {
                setValidating(true)
                await prepareImageSource(values.imageUrl)
                setValidating(false)
              }
              const result = await save.mutateAsync({ id: category?.id, data: values })
              flushSync(() =>
                form.reset({
                  name: result.name,
                  slug: result.slug,
                  description: result.description ?? '',
                  imageUrl: result.imageUrl ?? '',
                  sortOrder: result.sortOrder,
                  active: result.active,
                }),
              )
              useUiStore
                .getState()
                .pushToast({ message: 'Categoría guardada.', variant: 'success' })
              onClose()
            } catch (error) {
              setError(
                applyAdminFormError<CategoryFormValues>(error, form.setError, [
                  'name',
                  'slug',
                  'description',
                  'imageUrl',
                  'sortOrder',
                  'active',
                ]),
              )
            } finally {
              setValidating(false)
            }
          })}
        >
          <Input
            label="Nombre"
            {...name}
            onChange={(e) => {
              void name.onChange(e)
              if (!manualSlug.current)
                form.setValue('slug', toSlug(e.target.value), { shouldDirty: true })
            }}
            error={fields.name?.message}
          />
          <Input
            label="Slug"
            {...slug}
            onChange={(e) => {
              manualSlug.current = true
              void slug.onChange(e)
            }}
            error={fields.slug?.message}
          />
          <Textarea
            label="Descripción"
            {...form.register('description')}
            error={fields.description?.message}
          />
          <Input
            label="URL de imagen"
            {...form.register('imageUrl')}
            error={fields.imageUrl?.message}
          />
          <Input
            label="Orden de aparición"
            type="number"
            min="0"
            step="1"
            {...form.register('sortOrder', { valueAsNumber: true })}
            error={fields.sortOrder?.message}
          />
          {category && (
            <label className="flex items-center gap-2">
              <input type="checkbox" {...form.register('active')} />
              Activa
            </label>
          )}
        </FormShell>
      </Modal>
      <ConfirmDialog
        open={discard}
        title="Descartar cambios"
        description="Los cambios de esta categoría no se han guardado."
        onCancel={() => setDiscard(false)}
        onConfirm={onClose}
        confirmText="Descartar"
      />
    </>
  )
}
export function CategoriesPage() {
  useDocumentTitle('Categorías | Administración', 'Organiza las categorías del catálogo.')
  const query = useAdminCategories()
  const remove = useDeleteCategory()
  const reorder = useReorderCategories()
  const [editing, setEditing] = useState<CatalogCategory | 'new' | null>(null)
  const [deleting, setDeleting] = useState<CatalogCategory | null>(null)
  const dragId = useRef<number | null>(null)
  const rows = query.data ?? []
  function move(id: number, target: number) {
    if (reorder.isPending || target < 0 || target >= rows.length) return
    const ordered = [...rows]
    const source = ordered.findIndex((row) => row.id === id)
    if (source < 0 || source === target) return
    const [moved] = ordered.splice(source, 1)
    if (!moved) return
    ordered.splice(target, 0, moved)
    reorder.mutate(
      { categoryOrders: ordered.map((row, sortOrder) => ({ categoryId: row.id, sortOrder })) },
      {
        onSuccess: () =>
          useUiStore
            .getState()
            .pushToast({ message: 'Orden de categorías actualizado.', variant: 'success' }),
      },
    )
  }
  const columns: DataColumn<CatalogCategory>[] = [
    {
      id: 'image',
      header: 'Imagen',
      cell: (row) =>
        row.imageUrl ? (
          <img
            src={row.imageUrl}
            alt=""
            loading="lazy"
            className="aspect-square w-12 min-w-12 rounded object-cover"
          />
        ) : (
          '—'
        ),
    },
    {
      id: 'name',
      header: 'Nombre',
      cell: (row) => (
        <span className="font-semibold">
          {row.name}
          {row.active ? '' : ' (inactiva)'}
        </span>
      ),
    },
    { id: 'slug', header: 'Slug', cell: (row) => row.slug },
    { id: 'count', header: 'Productos', cell: (row) => row.productCount },
    {
      id: 'order',
      header: 'Orden',
      cell: (row) => {
        const index = rows.findIndex((item) => item.id === row.id)
        return (
          <div
            className="flex items-center gap-2"
            onDragOver={(e) => {
              if (!reorder.isPending) e.preventDefault()
            }}
            onDrop={(e) => {
              e.preventDefault()
              if (dragId.current !== null) move(dragId.current, index)
              dragId.current = null
            }}
          >
            <span
              draggable={!reorder.isPending}
              onDragStart={() => {
                dragId.current = row.id
              }}
              onDragEnd={() => {
                dragId.current = null
              }}
              title="Arrastra sobre el orden de otra categoría"
              className="cursor-grab"
            >
              <GripVertical size={18} />
            </span>
            {row.sortOrder}
            <Button
              variant="outline"
              size="sm"
              aria-label={`Subir ${row.name}`}
              disabled={index === 0 || reorder.isPending}
              onClick={() => move(row.id, index - 1)}
            >
              <ArrowUp size={14} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-label={`Bajar ${row.name}`}
              disabled={index === rows.length - 1 || reorder.isPending}
              onClick={() => move(row.id, index + 1)}
            >
              <ArrowDown size={14} />
            </Button>
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: (row) => (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(row)}>
              Editar
            </Button>
            <span
              title={
                row.productCount
                  ? `No se puede eliminar: ${row.productCount} productos asociados.`
                  : undefined
              }
            >
              <Button
                variant="outline"
                size="sm"
                disabled={row.productCount > 0}
                onClick={() => {
                  remove.reset()
                  setDeleting(row)
                }}
              >
                Eliminar
              </Button>
            </span>
          </div>
          {row.productCount > 0 && (
            <p className="text-xs text-vm-muted">
              {row.productCount} productos asociados; borrado bloqueado.
            </p>
          )}
        </div>
      ),
    },
  ]
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Categorías</h1>
        <Button onClick={() => setEditing('new')}>Crear categoría</Button>
      </div>
      <p className="text-sm text-vm-muted">
        El conteo incluye productos activos e inactivos. Arrastra el control de orden o usa las
        flechas para reordenar.
      </p>
      {reorder.error && <p role="alert">{adminErrorMessage(reorder.error)}</p>}
      <DataTable
        caption="Categorías"
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        pagination={{ page: 1, size: rows.length, totalPages: 1, totalElements: rows.length }}
        onPageChange={() => undefined}
        isLoading={query.isPending}
        isFetching={query.isFetching || reorder.isPending}
        error={query.error}
        onRetry={() => void query.refetch()}
        emptyMessage="No hay categorías."
        emptyAction={<Button onClick={() => setEditing('new')}>Crear categoría</Button>}
      />
      {editing && (
        <CategoryEditor
          key={editing === 'new' ? 'new' : editing.id}
          category={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          open
          title="Eliminar categoría"
          description={`Se desactivará «${deleting.name}» y sus subcategorías. El servidor bloqueará la acción si hay productos asociados.`}
          error={remove.error ? adminErrorMessage(remove.error) : undefined}
          pending={remove.isPending}
          onCancel={() => setDeleting(null)}
          onConfirm={() =>
            remove.mutate(deleting.id, {
              onSuccess: () => {
                setDeleting(null)
                useUiStore
                  .getState()
                  .pushToast({ message: 'Categoría desactivada.', variant: 'success' })
              },
            })
          }
        />
      )}
    </div>
  )
}
