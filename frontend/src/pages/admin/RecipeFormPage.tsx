import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  useForm,
  useFieldArray,
  useWatch,
  Controller,
  type FieldPath,
  type FieldErrors,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Recipe } from '@/api/adminRecipes'
import { ApiError } from '@/api/types'
import { FormShell } from '@/components/admin/FormShell'
import { ImageUploader } from '@/components/admin/ImageUploader'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAdminRecipe, useSaveRecipe, type SaveIntent } from '@/features/admin/recipes/hooks'
import {
  recipeSchema,
  recipeDefaults,
  recipePayload,
  emptyIngredient,
  emptyStep,
  type RecipeValues,
} from '@/features/admin/recipes/form'
import { SortableRows, SortableRow } from '@/features/admin/recipes/SortableRows'
import { IngredientPaste } from '@/features/admin/recipes/IngredientPaste'
import { TagChips } from '@/features/admin/recipes/TagChips'
import { useRecipeCategories, useRecipeTags } from '@/features/recipes/hooks'
import { toSlug } from '@/lib/slug'
import { useUiStore } from '@/store/uiStore'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { adminErrorMessage } from '@/lib/adminErrors'
function RecipeForm({ recipe }: { recipe?: Recipe }) {
  const navigate = useNavigate(),
    categories = useRecipeCategories(),
    tags = useRecipeTags(),
    save = useSaveRecipe()
  const [saved, setSaved] = useState(recipe)
  const savedRef = useRef(recipe),
    manualSlug = useRef(!!recipe)
  const [error, setError] = useState<string>(),
    [checking, setChecking] = useState<string[]>([])
  const [sections, setSections] = useState({
    general: true,
    ingredients: true,
    steps: true,
    nutrition: false,
  })
  const form = useForm<RecipeValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues: recipeDefaults(recipe),
    shouldFocusError: false,
  })
  const ingredients = useFieldArray({ control: form.control, name: 'ingredients' }),
    steps = useFieldArray({ control: form.control, name: 'steps' })
  const nutritionEnabled = useWatch({ control: form.control, name: 'nutritionEnabled' }),
    errors = form.formState.errors
  const busy = save.isPending || checking.length > 0
  const nutritionError = !!(
    errors.calories ||
    errors.proteinGrams ||
    errors.carbsGrams ||
    errors.fatGrams ||
    errors.fiberGrams
  )
  function imageBusy(key: string, value: boolean) {
    setChecking((old) => (value ? [...new Set([...old, key])] : old.filter((k) => k !== key)))
  }
  function invalid(e: FieldErrors<RecipeValues>) {
    setError('Revisa los campos señalados antes de guardar.')
    setSections((old) => ({
      ...old,
      general: true,
      ingredients: old.ingredients || !!e.ingredients,
      steps: old.steps || !!e.steps,
      nutrition:
        old.nutrition ||
        !!(e.calories || e.proteinGrams || e.carbsGrams || e.fatGrams || e.fiberGrams),
    }))
  }
  async function submit(values: RecipeValues, intent: SaveIntent) {
    setError(undefined)
    try {
      const result = await save.mutateAsync({
        id: savedRef.current?.id,
        data: recipePayload(values),
        intent,
        onSaved: (r) => {
          savedRef.current = r
          setSaved(r)
        },
      })
      savedRef.current = result
      setSaved(result)
      flushSync(() => form.reset(recipeDefaults(result)))
      useUiStore.getState().pushToast({
        variant: 'success',
        message:
          intent === 'publish'
            ? 'Receta publicada.'
            : intent === 'unpublish'
              ? 'Receta despublicada.'
              : 'Receta guardada.',
      })
      navigate(`/admin/recetas/${result.id}/editar`, { replace: true })
    } catch (e) {
      if (e instanceof ApiError && e.fieldErrors) {
        for (const [raw, message] of Object.entries(e.fieldErrors)) {
          const path = raw.replace(/\[(\d+)\]/g, '.$1')
          if (
            /^(title|slug|description|categoryId|prepTime|cookTime|servings|ingredients\.\d+\.(name|quantity|unit)|steps\.\d+\.(instruction|imageUrl))$/.test(
              path,
            )
          )
            form.setError(path as FieldPath<RecipeValues>, { message })
        }
        setSections({ general: true, ingredients: true, steps: true, nutrition: true })
      }
      setError(
        adminErrorMessage(e) +
          (savedRef.current
            ? ' Los datos pudieron guardarse antes de fallar la acción de publicación. Puedes reintentar sin crear otra receta.'
            : ''),
      )
    }
  }
  const title = form.register('title'),
    slug = form.register('slug')
  const categoryOptions = categories.data?.flatMap((c) => [c, ...c.children]) ?? []
  return (
    <FormShell
      title={recipe ? 'Editar receta' : 'Nueva receta'}
      description="Edita todas las secciones y guarda antes de salir. Las imágenes se gestionan por URL."
      isDirty={form.formState.isDirty}
      isSubmitting={busy}
      error={error}
      onCancel={() => navigate('/admin/recetas')}
      submitLabel={saved?.status === 'PUBLISHED' ? 'Guardar cambios' : 'Guardar borrador'}
      onSubmit={(event) =>
        void form.handleSubmit(
          (v) => submit(v, saved?.status === 'PUBLISHED' ? 'save' : 'draft'),
          invalid,
        )(event)
      }
      actions={
        <>
          {saved?.status !== 'PUBLISHED' && (
            <Button
              type="button"
              disabled={busy}
              onClick={() => void form.handleSubmit((v) => submit(v, 'publish'), invalid)()}
            >
              Publicar
            </Button>
          )}
          {saved?.status === 'PUBLISHED' && (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => void form.handleSubmit((v) => submit(v, 'unpublish'), invalid)()}
            >
              Despublicar
            </Button>
          )}
        </>
      }
    >
      {(categories.isError || tags.isError) && (
        <div role="alert">
          No se pudieron cargar categorías o tags.{' '}
          <Button
            type="button"
            onClick={() => {
              void categories.refetch()
              void tags.refetch()
            }}
          >
            Reintentar
          </Button>
        </div>
      )}
      <details
        open={sections.general}
        onToggle={(e) => {
          const open = e.currentTarget.open
          setSections((old) => ({ ...old, general: open }))
        }}
        className="rounded-lg border border-vm-line p-5"
      >
        <summary className="cursor-pointer text-xl font-bold">General</summary>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Input
            label="Título"
            {...title}
            error={errors.title?.message}
            onChange={(e) => {
              void title.onChange(e)
              if (!manualSlug.current)
                form.setValue('slug', toSlug(e.target.value), { shouldDirty: true })
            }}
          />
          <Input
            label="Slug"
            {...slug}
            error={errors.slug?.message}
            onChange={(e) => {
              manualSlug.current = true
              void slug.onChange(e)
            }}
          />
          <div className="lg:col-span-2">
            <Textarea
              label="Extracto"
              {...form.register('description')}
              error={errors.description?.message}
            />
          </div>
          <Select label="Categoría" {...form.register('categoryId', { valueAsNumber: true })}>
            <option value="0">Selecciona una categoría</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            {recipe?.category && !categoryOptions.some((c) => c.id === recipe.category?.id) && (
              <option value={recipe.category.id}>{recipe.category.name}</option>
            )}
          </Select>
          {errors.categoryId && (
            <p role="alert" className="text-sm text-red-700">
              {errors.categoryId.message}
            </p>
          )}
          <Select label="Dificultad" {...form.register('difficulty')}>
            <option value="EASY">Fácil</option>
            <option value="MEDIUM">Media</option>
            <option value="HARD">Difícil</option>
          </Select>
          <Controller
            name="tagIds"
            control={form.control}
            render={({ field }) => (
              <TagChips
                value={field.value}
                onChange={field.onChange}
                tags={tags.data ?? recipe?.tags ?? []}
              />
            )}
          />
          <Input
            type="number"
            label="Preparación (minutos)"
            {...form.register('prepTime', { valueAsNumber: true })}
            error={errors.prepTime?.message}
          />
          <Input
            type="number"
            label="Cocción (minutos)"
            {...form.register('cookTime', { valueAsNumber: true })}
            error={errors.cookTime?.message}
          />
          <Input
            type="number"
            label="Porciones"
            {...form.register('servings', { valueAsNumber: true })}
            error={errors.servings?.message}
          />
          <div className="lg:col-span-2">
            <Controller
              name="hero"
              control={form.control}
              render={({ field }) => (
                <ImageUploader
                  title="Imagen hero"
                  description="Una URL pública para la portada de la receta."
                  maxImages={1}
                  images={field.value ? [{ key: 'hero', url: field.value }] : []}
                  onChange={(images) => field.onChange(images[0]?.url ?? '')}
                  onBusyChange={(value) => imageBusy('hero', value)}
                />
              )}
            />
            {errors.hero && <p role="alert">{errors.hero.message}</p>}
          </div>
        </div>
      </details>
      <details
        open={sections.ingredients || !!errors.ingredients}
        onToggle={(e) => {
          const open = e.currentTarget.open
          setSections((old) => ({ ...old, ingredients: open }))
        }}
        className="rounded-lg border border-vm-line p-5"
      >
        <summary className="cursor-pointer text-xl font-bold">Ingredientes</summary>
        <div className="mt-5 space-y-4">
          <p className="text-sm text-vm-muted">
            La unidad es texto libre. La cantidad puede quedar vacía cuando no aplique.
          </p>
          <IngredientPaste onApply={(rows) => ingredients.append(rows)} />
          {errors.ingredients?.root?.message && (
            <p role="alert">{errors.ingredients.root.message}</p>
          )}
          {errors.ingredients?.message && <p role="alert">{errors.ingredients.message}</p>}
          <SortableRows ids={ingredients.fields.map((f) => f.id)} move={ingredients.move}>
            {ingredients.fields.map((f, index) => (
              <SortableRow
                key={f.id}
                id={f.id}
                label="Ingrediente"
                index={index}
                count={ingredients.fields.length}
                move={ingredients.move}
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input
                    label={`Cantidad ${index + 1}`}
                    {...form.register(`ingredients.${index}.quantity`)}
                    error={errors.ingredients?.[index]?.quantity?.message}
                  />
                  <Input
                    label={`Unidad ${index + 1}`}
                    {...form.register(`ingredients.${index}.unit`)}
                    error={errors.ingredients?.[index]?.unit?.message}
                  />
                  <Input
                    label={`Nombre ${index + 1}`}
                    {...form.register(`ingredients.${index}.name`)}
                    error={errors.ingredients?.[index]?.name?.message}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => ingredients.remove(index)}
                >
                  Eliminar ingrediente {index + 1}
                </Button>
              </SortableRow>
            ))}
          </SortableRows>
          <Button
            type="button"
            variant="outline"
            onClick={() => ingredients.append(emptyIngredient())}
          >
            Agregar ingrediente
          </Button>
        </div>
      </details>
      <details
        open={sections.steps || !!errors.steps}
        onToggle={(e) => {
          const open = e.currentTarget.open
          setSections((old) => ({ ...old, steps: open }))
        }}
        className="rounded-lg border border-vm-line p-5"
      >
        <summary className="cursor-pointer text-xl font-bold">Pasos</summary>
        <div className="mt-5 space-y-4">
          {errors.steps?.root?.message && <p role="alert">{errors.steps.root.message}</p>}
          {errors.steps?.message && <p role="alert">{errors.steps.message}</p>}
          <SortableRows ids={steps.fields.map((f) => f.id)} move={steps.move}>
            {steps.fields.map((f, index) => (
              <SortableRow
                key={f.id}
                id={f.id}
                label="Paso"
                index={index}
                count={steps.fields.length}
                move={steps.move}
              >
                <Textarea
                  label={`Descripción del paso ${index + 1}`}
                  {...form.register(`steps.${index}.instruction`)}
                  error={errors.steps?.[index]?.instruction?.message}
                />
                <details className="my-4">
                  <summary className="cursor-pointer">Imagen opcional del paso {index + 1}</summary>
                  <Controller
                    name={`steps.${index}.imageUrl`}
                    control={form.control}
                    render={({ field }) => (
                      <ImageUploader
                        title={`Imagen del paso ${index + 1}`}
                        description="Una imagen opcional para este paso."
                        maxImages={1}
                        images={field.value ? [{ key: f.id, url: field.value }] : []}
                        onChange={(images) => field.onChange(images[0]?.url ?? '')}
                        onBusyChange={(value) => imageBusy(f.id, value)}
                      />
                    )}
                  />
                </details>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => steps.remove(index)}
                >
                  Eliminar paso {index + 1}
                </Button>
              </SortableRow>
            ))}
          </SortableRows>
          <Button type="button" variant="outline" onClick={() => steps.append(emptyStep())}>
            Agregar paso
          </Button>
        </div>
      </details>
      <details
        open={sections.nutrition || nutritionError}
        onToggle={(e) => {
          const open = e.currentTarget.open
          setSections((old) => ({ ...old, nutrition: open }))
        }}
        className="rounded-lg border border-vm-line p-5"
      >
        <summary className="cursor-pointer text-xl font-bold">Nutrición</summary>
        <label className="my-5 flex items-center gap-2">
          <input type="checkbox" {...form.register('nutritionEnabled')} />
          Esta receta tiene información nutricional
        </label>
        {nutritionEnabled ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {(['calories', 'proteinGrams', 'carbsGrams', 'fatGrams', 'fiberGrams'] as const).map(
              (key, index) => (
                <Input
                  key={key}
                  label={
                    ['Calorías', 'Proteínas (g)', 'Carbohidratos (g)', 'Grasas (g)', 'Fibra (g)'][
                      index
                    ]
                  }
                  inputMode="decimal"
                  {...form.register(key)}
                  error={errors[key]?.message}
                />
              ),
            )}
          </div>
        ) : (
          <p className="text-sm text-vm-muted">
            Al guardar se omitirán los valores nutricionales y se quitará la nutrición previamente
            guardada.
          </p>
        )}
      </details>
    </FormShell>
  )
}
export function RecipeFormPage() {
  const rawId = useParams().id
  const id = rawId === undefined ? undefined : Number(rawId)
  const query = useAdminRecipe(id)
  useDocumentTitle(
    rawId ? 'Editar receta' : 'Nueva receta',
    'Editor de recetas, ingredientes, pasos y nutrición.',
  )
  if (rawId && (!Number.isSafeInteger(id) || !id || id < 1)) return <p>Receta no encontrada.</p>
  if (rawId && query.isPending)
    return (
      <div role="status" aria-label="Cargando receta">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="mt-5 h-96 w-full" />
      </div>
    )
  if (rawId && query.isError)
    return (
      <div role="alert">
        <p>
          {query.error instanceof ApiError && query.error.status === 404
            ? 'Receta no encontrada.'
            : adminErrorMessage(query.error)}
        </p>
        <Button onClick={() => void query.refetch()}>Reintentar</Button>
        <Link to="/admin/recetas">Volver a recetas</Link>
      </div>
    )
  return <RecipeForm key={rawId ?? 'new'} recipe={query.data} />
}
