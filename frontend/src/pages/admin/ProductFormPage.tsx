import { toSlug } from '@/lib/slug'
import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ProductResponse } from '@/api/schema'
import { ApiError } from '@/api/types'
import { useAdminProduct, useAdminCategories, useSaveProduct } from '@/features/admin/catalogHooks'
import { productSchema, type ProductFormValues } from '@/features/admin/catalogForms'
import { FormShell } from '@/components/admin/FormShell'
import { ImageUploader } from '@/components/admin/ImageUploader'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { adminErrorMessage, applyAdminFormError } from '@/lib/adminErrors'
import { formatCurrency } from '@/lib/formatters'
import { useUiStore } from '@/store/uiStore'
function defaults(product?: ProductResponse): ProductFormValues {
  return {
    name: product?.name ?? '',
    slug: product?.slug ?? '',
    description: product?.description ?? '',
    price: product?.price ?? 0,
    stock: product?.stock ?? 0,
    categoryId: product?.category?.id ?? 0,
    featured: product?.featured ?? false,
    active: product?.active ?? true,
    images: [...(product?.images ?? [])]
      .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder)
      .map((image) => ({ key: String(image.id), url: image.url, altText: image.altText })),
  }
}
function ProductForm({ product }: { product?: ProductResponse }) {
  const navigate = useNavigate()
  const categories = useAdminCategories()
  const save = useSaveProduct()
  const manualSlug = useRef(Boolean(product))
  const [checkingImages, setCheckingImages] = useState(false)
  const [error, setError] = useState<string>()
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: defaults(product),
  })
  const images = useWatch({ control: form.control, name: 'images' })
  const fields = form.formState.errors
  const name = form.register('name')
  const slug = form.register('slug')
  return (
    <FormShell
      title={product ? `Editar ${product.name}` : 'Nuevo producto'}
      description="Precios en pesos colombianos. Los cambios se publican al guardar."
      isDirty={form.formState.isDirty}
      isSubmitting={save.isPending || checkingImages}
      onCancel={() => navigate('/admin/productos')}
      error={error}
      onSubmit={form.handleSubmit(async (values) => {
        setError(undefined)
        if (!categories.data) {
          setError('Espera a que carguen las categorías o reintenta.')
          return
        }
        const { images: selectedImages, ...data } = values
        try {
          const result = await save.mutateAsync({
            id: product?.id,
            data,
            imageUrls: selectedImages.map((image) => image.url),
          })
          flushSync(() => form.reset(defaults(result)))
          useUiStore.getState().pushToast({ message: 'Producto guardado.', variant: 'success' })
          navigate(`/admin/productos/${result.id}/editar`, { replace: true })
        } catch (error) {
          setError(
            applyAdminFormError<ProductFormValues>(error, form.setError, [
              'name',
              'slug',
              'description',
              'price',
              'stock',
              'categoryId',
              'featured',
              'active',
              'images',
            ]) +
              ' Si falló una imagen, algunos cambios pueden haberse guardado; puedes reintentar sin duplicarla.',
          )
        }
      })}
    >
      <div className="grid gap-5 lg:grid-cols-2">
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
        <Controller
          name="price"
          control={form.control}
          render={({ field }) => (
            <Input
              label="Precio (COP)"
              id="price"
              name={field.name}
              ref={field.ref}
              inputMode="numeric"
              value={Number.isFinite(field.value) ? formatCurrency(field.value) : ''}
              onBlur={field.onBlur}
              onChange={(e) => {
                const digits = e.target.value.replace(/[^0-9]/g, '')
                field.onChange(digits ? Number(digits) : 0)
              }}
              error={fields.price?.message}
            />
          )}
        />
        <Input
          label="Stock"
          type="number"
          min="0"
          step="1"
          {...form.register('stock', { valueAsNumber: true })}
          error={fields.stock?.message}
        />
        <div>
          <Select
            label="Categoría"
            {...form.register('categoryId', { valueAsNumber: true })}
            aria-invalid={!!fields.categoryId}
            aria-describedby={fields.categoryId ? 'categoryId-error' : undefined}
          >
            <option value="0">Selecciona una categoría</option>
            {categories.data?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {category.active ? '' : ' (inactiva)'}
              </option>
            ))}
          </Select>
          {fields.categoryId && (
            <p id="categoryId-error" className="mt-1 text-xs text-red-600">
              {fields.categoryId.message}
            </p>
          )}
          {categories.error && (
            <div role="alert">
              {adminErrorMessage(categories.error)}
              <Button type="button" variant="outline" onClick={() => void categories.refetch()}>
                Reintentar
              </Button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2">
            <input type="checkbox" {...form.register('featured')} />
            Destacado
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" {...form.register('active')} />
            Activo
          </label>
        </div>
      </div>
      <Textarea
        label="Descripción"
        rows={5}
        {...form.register('description')}
        error={fields.description?.message}
      />
      <ImageUploader
        onBusyChange={setCheckingImages}
        images={images}
        disabled={save.isPending}
        onChange={(value) =>
          form.setValue('images', value, { shouldDirty: true, shouldValidate: true })
        }
      />
      {fields.images && (
        <p role="alert" className="text-sm text-red-600">
          {fields.images.message ?? 'Revisa las URLs de las imágenes.'}
        </p>
      )}
    </FormShell>
  )
}
export function ProductFormPage() {
  const { id } = useParams()
  const numberId = Number(id)
  const query = useAdminProduct(numberId)
  useDocumentTitle(
    `${id ? 'Editar' : 'Nuevo'} producto | Administración`,
    'Formulario de producto de Verde Mango.',
  )
  if (!id) return <ProductForm />
  if (
    !Number.isSafeInteger(numberId) ||
    numberId <= 0 ||
    (query.error instanceof ApiError && query.error.status === 404)
  )
    return (
      <div>
        <h1 className="text-2xl font-bold">Producto no encontrado</h1>
        <Link to="/admin/productos" className="underline">
          Volver a productos
        </Link>
      </div>
    )
  if (query.isPending)
    return (
      <div role="status" className="space-y-5">
        <span className="sr-only">Cargando producto…</span>
        {[1, 2, 3, 4].map((key) => (
          <div key={key} className="h-16 animate-pulse rounded bg-stone-100" />
        ))}
      </div>
    )
  if (query.error)
    return (
      <div role="alert">
        <p>{adminErrorMessage(query.error)}</p>
        <Button onClick={() => void query.refetch()}>Reintentar</Button>
      </div>
    )
  return <ProductForm key={query.data.id} product={query.data} />
}
