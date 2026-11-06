import { useEffect, useRef, type RefObject } from 'react'
import { flushSync } from 'react-dom'

/**
 * While `open`, a pointer press outside `ref` calls `onOutside` (to close the menu) and leaves focus on whatever was
 * pressed. `flushSync` makes the menu (and its focus trap) go away before the browser moves focus, so the trap does not
 * pull focus back into the menu.
 */
export function useOutsideClose(ref: RefObject<HTMLElement | null>, open: boolean, onOutside: () => void) {
  const latest = useRef(onOutside)
  useEffect(() => {
    latest.current = onOutside
  })

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) flushSync(() => latest.current())
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [open, ref])
}
