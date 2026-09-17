import type { RecipeStepResponse } from '@/api/schema'
export function StepList({ steps }: { steps: RecipeStepResponse[] }) {
  return (
    <section className="recipe-print-section">
      <h2 className="mb-6 text-2xl font-bold">Preparación</h2>
      <ol className="space-y-8">
        {[...steps]
          .sort((a, b) => a.stepNumber - b.stepNumber)
          .map((step) => (
            <li key={step.id} className="flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-vm-orange font-bold text-white">
                {step.stepNumber}
              </span>
              <div className="min-w-0 max-w-[70ch] space-y-3">
                <p className="whitespace-pre-line text-lg leading-relaxed">{step.instruction}</p>
                {step.estimatedTime != null && (
                  <p className="text-sm text-vm-muted">Tiempo estimado: {step.estimatedTime} min</p>
                )}
                {step.tip && (
                  <p className="rounded-vm-md bg-vm-cream p-3 leading-relaxed">
                    Consejo: {step.tip}
                  </p>
                )}
                {step.imageUrl && (
                  <img
                    src={step.imageUrl}
                    alt={`Paso ${step.stepNumber}`}
                    loading="lazy"
                    className="aspect-video w-full rounded-vm-lg object-cover"
                  />
                )}
              </div>
            </li>
          ))}
      </ol>
    </section>
  )
}
