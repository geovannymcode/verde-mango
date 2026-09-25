import type { ReactNode } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { GripVertical } from 'lucide-react'
export function SortableRows({
  ids,
  move,
  children,
}: {
  ids: string[]
  move: (from: number, to: number) => void
  children: ReactNode
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            'Pulsa espacio para tomar la fila, flechas para moverla y espacio para soltarla. Escape cancela.',
        },
      }}
      onDragEnd={({ active, over }) => {
        if (over && active.id !== over.id) {
          const a = ids.indexOf(String(active.id)),
            b = ids.indexOf(String(over.id))
          if (a >= 0 && b >= 0) move(a, b)
        }
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">{children}</div>
      </SortableContext>
    </DndContext>
  )
}
export function SortableRow({
  id,
  index,
  count,
  label,
  move,
  children,
}: {
  id: string
  index: number
  count: number
  label: string
  move: (a: number, b: number) => void
  children: ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
      }}
      className={`rounded-lg border border-vm-line bg-white p-4 ${isDragging ? 'relative z-20 shadow-xl' : ''}`}
    >
      <div className="mb-3 flex items-center gap-3">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Mover ${label} ${index + 1}`}
          className="touch-none cursor-grab rounded border border-vm-line p-2 focus-visible:outline-2 focus-visible:outline-vm-orange"
          onKeyDown={(event) => {
            if (!isDragging && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
              event.preventDefault()
              const next = index + (event.key === 'ArrowUp' ? -1 : 1)
              if (next >= 0 && next < count) move(index, next)
            } else listeners?.onKeyDown?.(event)
          }}
        >
          <GripVertical size={18} />
        </button>
        <strong>
          {label} {index + 1}
        </strong>
        <span className="text-xs text-vm-muted">Arrastra o usa ↑ ↓</span>
      </div>
      {children}
    </div>
  )
}
