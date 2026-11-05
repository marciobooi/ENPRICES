import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export interface FocusTrapSettings {
  /** Called when the user presses Escape or clicks outside the container. */
  onDeactivate?: () => void
  /** CSS selector (inside the container) to focus first. Default: the first focusable element. `false` leaves focus alone. */
  initialFocus?: string | false
  /** Restore focus to the previously focused element when the trap ends. Default: true. */
  returnFocus?: boolean
  /** Deactivate on Escape. Default: true. */
  closeOnEscape?: boolean
  /** Deactivate on pointer press outside the container. Default: true. */
  closeOnOutsideClick?: boolean
  /** Targets outside the container that must not count as an "outside click" (e.g. the toggle button). */
  isIgnoredTarget?: (target: Node) => boolean
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute('hidden') && element.getClientRects().length > 0,
  )
}

/**
 * Framework-free focus trap. Returns a function that releases it.
 *
 * - Moves focus into the container.
 * - Keeps Tab / Shift+Tab cycling inside the container (also pulls focus back if it escaped).
 * - Optionally closes on Escape and on outside clicks.
 * - Optionally returns focus to the element that had it before.
 *
 * Use it directly for third-party widgets (e.g. the guided tour popover) and through `useFocusTrap` in React.
 */
export function createFocusTrap(container: HTMLElement, settings: FocusTrapSettings = {}): () => void {
  const {
    onDeactivate,
    initialFocus,
    returnFocus = true,
    closeOnEscape = true,
    closeOnOutsideClick = true,
    isIgnoredTarget,
  } = settings

  const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null

  if (initialFocus !== false) {
    const target =
      (initialFocus ? container.querySelector<HTMLElement>(initialFocus) : null) ?? getFocusable(container)[0]
    if (target) target.focus()
    else {
      if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '-1')
      container.focus()
    }
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && closeOnEscape) {
      event.preventDefault()
      onDeactivate?.()
      return
    }
    if (event.key !== 'Tab') return
    // Third-party widgets (e.g. driver.js) have their own Tab handling; this trap decides alone.
    event.stopPropagation()

    const focusable = getFocusable(container)
    if (focusable.length === 0) {
      event.preventDefault()
      return
    }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const current = document.activeElement

    if (!container.contains(current)) {
      event.preventDefault()
      first.focus()
    } else if (event.shiftKey && current === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && current === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const handlePointerDown = (event: PointerEvent) => {
    if (!closeOnOutsideClick) return
    const target = event.target as Node | null
    if (!target || container.contains(target) || isIgnoredTarget?.(target)) return
    onDeactivate?.()
  }

  // If focus lands outside by any other route (script, screen reader), pull it back in.
  const handleFocusIn = (event: FocusEvent) => {
    const target = event.target as Node | null
    if (target && !container.contains(target) && !isIgnoredTarget?.(target)) {
      const focusable = getFocusable(container)
      ;(focusable[0] ?? container).focus()
    }
  }

  // Capture phase: runs before any other keydown listener so it can stop them.
  document.addEventListener('keydown', handleKeyDown, true)
  document.addEventListener('pointerdown', handlePointerDown)
  if (!closeOnOutsideClick) document.addEventListener('focusin', handleFocusIn)

  return () => {
    document.removeEventListener('keydown', handleKeyDown, true)
    document.removeEventListener('pointerdown', handlePointerDown)
    document.removeEventListener('focusin', handleFocusIn)
    if (returnFocus && previouslyFocused?.isConnected) previouslyFocused.focus()
  }
}

export interface FocusTrapOptions extends Omit<FocusTrapSettings, 'isIgnoredTarget'> {
  /** The trap only runs while this is true. */
  active: boolean
  /** Elements outside the container that must not count as an "outside click" (e.g. the toggle button). */
  ignoreOutsideClick?: Array<RefObject<Element | null>>
}

/** React wrapper around `createFocusTrap` for popovers, menus and custom dialogs. Native `<dialog>.showModal()` already traps focus. */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  { active, onDeactivate, initialFocus, returnFocus, closeOnEscape, closeOnOutsideClick, ignoreOutsideClick }: FocusTrapOptions,
) {
  // Keep the latest callback/refs without re-running the effect on every render.
  const onDeactivateRef = useRef(onDeactivate)
  const ignoreRef = useRef(ignoreOutsideClick)
  useEffect(() => {
    onDeactivateRef.current = onDeactivate
    ignoreRef.current = ignoreOutsideClick
  })

  useEffect(() => {
    const container = containerRef.current
    if (!active || !container) return
    return createFocusTrap(container, {
      initialFocus,
      returnFocus,
      closeOnEscape,
      closeOnOutsideClick,
      onDeactivate: () => onDeactivateRef.current?.(),
      isIgnoredTarget: (target) => !!ignoreRef.current?.some((ref) => ref.current?.contains(target)),
    })
  }, [active, containerRef, initialFocus, returnFocus, closeOnEscape, closeOnOutsideClick])
}
