import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'

const SELECTOR = 'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]'
const traps: HTMLElement[] = []

/** Owns the complete modal focus lifecycle. MobileNav inherits it through Drawer. */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  onClose: () => void,
) {
  const closeRef = useRef(onClose)
  useLayoutEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const current = containerRef.current
    if (!active || !current) return
    const container: HTMLElement = current
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    traps.push(container)
    const isTop = () => traps.at(-1) === container
    // Preserve prior inert values, including when another modal is already open.
    const background: Array<{ element: HTMLElement; inert: boolean }> = []
    let branch: HTMLElement = container
    while (branch.parentElement) {
      for (const sibling of Array.from(branch.parentElement.children)) {
        if (sibling instanceof HTMLElement && sibling !== branch) {
          background.push({ element: sibling, inert: sibling.hasAttribute('inert') })
          sibling.setAttribute('inert', '')
        }
      }
      if (branch.parentElement === document.body) break
      branch = branch.parentElement
    }
    const controls = () =>
      Array.from(container.querySelectorAll<HTMLElement>(SELECTOR)).filter((element) => {
        if (element.tabIndex < 0 || element.matches(':disabled')) return false
        for (let node: HTMLElement | null = element; node; node = node.parentElement) {
          const style = getComputedStyle(node)
          if (
            node.hidden ||
            node.hasAttribute('inert') ||
            style.display === 'none' ||
            style.visibility === 'hidden'
          )
            return false
          if (node === container) break
        }
        return true
      })
    function onKeyDown(event: KeyboardEvent) {
      if (!isTop()) return
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopImmediatePropagation()
        closeRef.current()
      } else if (event.key === 'Tab') {
        const items = controls()
        const first = items[0]
        const last = items.at(-1)
        const focused = document.activeElement
        if (!first || !last) {
          event.preventDefault()
          container.focus()
        } else if (!container.contains(focused) || focused === container) {
          event.preventDefault()
          ;(event.shiftKey ? last : first).focus()
        } else if (event.shiftKey ? focused === first : focused === last) {
          event.preventDefault()
          ;(event.shiftKey ? last : first).focus()
        }
      }
    }
    function onFocusIn(event: FocusEvent) {
      if (isTop() && event.target instanceof Node && !container.contains(event.target))
        container.focus()
    }
    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('focusin', onFocusIn)
    container.focus()
    return () => {
      const wasTop = isTop()
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('focusin', onFocusIn)
      traps.splice(traps.indexOf(container), 1)
      for (const { element, inert } of background) element.toggleAttribute('inert', inert)
      if (wasTop && trigger?.isConnected && !trigger.closest('[inert]')) trigger.focus()
    }
  }, [active, containerRef])
}
