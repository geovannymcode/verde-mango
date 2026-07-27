import { ShoppingBag } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'

export function CartDrawer() {
  const cartDrawerOpen = useUiStore((state) => state.cartDrawerOpen)
  const closeCartDrawer = useUiStore((state) => state.closeCartDrawer)

  return (
    <Drawer open={cartDrawerOpen} onClose={closeCartDrawer} title="Tu carrito">
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-vm-muted">
        <ShoppingBag size={40} className="text-vm-line" />
        <p className="text-sm">Tu carrito está vacío.</p>
        <p className="text-xs">Muy pronto podrás agregar productos aquí.</p>
        <Button variant="outline" size="sm" onClick={closeCartDrawer}>
          Seguir comprando
        </Button>
      </div>
    </Drawer>
  )
}
