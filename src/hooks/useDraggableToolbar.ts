import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type RefObject } from 'react'

interface Offset {
  x: number
  y: number
}

const STORAGE_KEY = 'enprices-floating-bar-v1'
const COLLAPSED_KEY = 'enprices-floating-bar-collapsed-v1'
const STEP = 16
const BIG_STEP = 64
/** Space kept between the bar and the edge of the window. */
const MARGIN = 8
/** A click that follows a move of more than this many pixels was a drag, not a click. */
const DRAG_THRESHOLD = 3

function readStored(): Offset {
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<Offset> | null
    if (value && Number.isFinite(value.x) && Number.isFinite(value.y)) return { x: value.x as number, y: value.y as number }
  } catch {
    /* storage can be blocked: the bar then simply starts at its usual place */
  }
  return { x: 0, y: 0 }
}

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) === 'true'
  } catch {
    return false
  }
}

function store(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* nothing to do: the position is a convenience */
  }
}

export interface DragMessages {
  picked: string
  dropped: string
  cancelled: string
  reset: string
  collapsed: string
  expanded: string
}

/**
 * Lets a floating bar be moved, by mouse or touch (drag the handle) and by keyboard (Space on the handle picks it
 * up, the arrow keys move it, Space or Enter drops it, Escape puts it back, Home resets it), so no one needs a
 * pointer to move it (WCAG 2.5.7). Double-click on the handle (or Enter on it) tucks the bar away so that only the
 * handle is left at the edge of the window; a click (or Enter) brings it back. The bar stays inside the window and
 * remembers where it was left and whether it was tucked away.
 */
export function useDraggableToolbar(ref: RefObject<HTMLElement | null>, messages: DragMessages) {
  const [offset, setOffset] = useState<Offset>(readStored)
  const [collapsed, setCollapsedState] = useState(readCollapsed)
  const [dragging, setDragging] = useState(false)
  const [grabbed, setGrabbed] = useState(false)
  const [message, setMessage] = useState('')
  // What is really on screen: a tucked-away bar sits against the edge, whatever its sideways offset was.
  const visual: Offset = collapsed ? { x: 0, y: offset.y } : offset
  const applied = useRef(visual)
  const collapsedRef = useRef(collapsed)
  const pointerStart = useRef<{ pointer: Offset; offset: Offset; moved: boolean } | null>(null)
  const keyStart = useRef<Offset>({ x: 0, y: 0 })
  const lastExpanded = useRef(0)

  useLayoutEffect(() => {
    applied.current = visual
    collapsedRef.current = collapsed
  }, [visual.x, visual.y, collapsed]) // eslint-disable-line react-hooks/exhaustive-deps

  /** How far the bar may travel from where it is drawn without 'offset': read from the page once per move or drag. */
  const limits = useCallback(() => {
    const element = ref.current
    if (!element) return null
    const rect = element.getBoundingClientRect()
    const baseLeft = rect.left - applied.current.x
    const baseTop = rect.top - applied.current.y
    const minX = MARGIN - baseLeft
    const minY = MARGIN - baseTop
    return {
      minX,
      maxX: Math.max(minX, window.innerWidth - MARGIN - (baseLeft + rect.width)),
      minY,
      maxY: Math.max(minY, window.innerHeight - MARGIN - (baseTop + rect.height)),
    }
  }, [ref])

  const clampTo = useCallback((box: ReturnType<typeof limits>, next: Offset): Offset => {
    if (!box) return next
    return {
      x: collapsedRef.current ? 0 : Math.round(Math.min(Math.max(next.x, box.minX), box.maxX)),
      y: Math.round(Math.min(Math.max(next.y, box.minY), box.maxY)),
    }
  }, [])

  const clamp = useCallback((next: Offset): Offset => clampTo(limits(), next), [clampTo, limits])

  // While the pointer drags the bar, its position is written straight to the element (once per frame): React is not asked
  // to render on every pointer move, and the limits are measured once at the start of the drag. The position is given to
  // React when the pointer is released.
  const dragLimits = useRef<ReturnType<typeof limits>>(null)
  const frame = useRef(0)
  const paint = useCallback(() => {
    frame.current = 0
    const element = ref.current
    if (element) element.style.transform = `translate3d(${applied.current.x}px, ${applied.current.y}px, 0)`
  }, [ref])

  const move = useCallback((next: Offset) => setOffset(clamp(next)), [clamp])

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value)
    store(COLLAPSED_KEY, value)
    setMessage(value ? messages.collapsed : messages.expanded)
    if (!value) lastExpanded.current = Date.now()
  }, [messages.collapsed, messages.expanded])

  const reset = useCallback(() => {
    setOffset({ x: 0, y: 0 })
    store(STORAGE_KEY, { x: 0, y: 0 })
    setMessage(messages.reset)
  }, [messages.reset])

  // Keep the bar in view when the window changes size or the page scrolls to its end.
  useEffect(() => {
    const keepInView = () => setOffset((current) => {
      // Not while the pointer is carrying the bar: it is placed by the drag.
      if (pointerStart.current?.moved) return current
      const next = clamp(current)
      return next.x === current.x && next.y === current.y ? current : next
    })
    window.addEventListener('resize', keepInView)
    window.addEventListener('scroll', keepInView, { passive: true })
    return () => {
      window.removeEventListener('resize', keepInView)
      window.removeEventListener('scroll', keepInView)
    }
  }, [clamp])

  // The position to remember: a tucked-away bar keeps the sideways offset it had before.
  const offsetRef = useRef(offset)
  useLayoutEffect(() => {
    offsetRef.current = offset
  }, [offset])
  const finish = useCallback(
    () => store(STORAGE_KEY, { x: collapsedRef.current ? offsetRef.current.x : applied.current.x, y: applied.current.y }),
    [],
  )

  const handleProps = {
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) return
      event.currentTarget.setPointerCapture(event.pointerId)
      pointerStart.current = { pointer: { x: event.clientX, y: event.clientY }, offset: applied.current, moved: false }
      dragLimits.current = limits()
      setDragging(true)
    },
    onPointerMove: (event: PointerEvent<HTMLButtonElement>) => {
      const start = pointerStart.current
      if (!start) return
      const dx = event.clientX - start.pointer.x
      const dy = event.clientY - start.pointer.y
      if (!start.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
      start.moved = true
      applied.current = clampTo(dragLimits.current, { x: start.offset.x + dx, y: start.offset.y + dy })
      if (!frame.current) frame.current = window.requestAnimationFrame(paint)
    },
    onPointerUp: () => {
      if (!pointerStart.current) return
      setDragging(false)
      if (pointerStart.current.moved) {
        window.cancelAnimationFrame(frame.current)
        paint()
        setOffset(applied.current)
        finish()
      }
      // `moved` stays on the record until the click that follows has been looked at
      window.setTimeout(() => { pointerStart.current = null }, 0)
    },
    onPointerCancel: () => {
      window.cancelAnimationFrame(frame.current)
      frame.current = 0
      pointerStart.current = null
      setDragging(false)
    },
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      // A click on the tucked-away handle brings the bar back. Not after a drag, and not the click a key press makes.
      if (event.detail === 0 || pointerStart.current?.moved) return
      if (collapsedRef.current) setCollapsed(false)
    },
    onDoubleClick: () => {
      // A double-click tucks the bar away; the click that has just brought it back must not undo itself.
      if (Date.now() - lastExpanded.current < 600) return
      setCollapsed(!collapsedRef.current)
    },
    onBlur: () => {
      if (!grabbed) return
      setGrabbed(false)
      finish()
    },
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      if (!grabbed) {
        if (event.key === ' ') {
          event.preventDefault()
          keyStart.current = applied.current
          setGrabbed(true)
          setMessage(messages.picked)
        } else if (event.key === 'Enter') {
          event.preventDefault()
          setCollapsed(!collapsedRef.current)
        }
        return // arrow keys then move between the controls of the toolbar
      }
      // While it is picked up the keys move the bar, and only that.
      event.stopPropagation()
      const step = event.shiftKey ? BIG_STEP : STEP
      const current = applied.current
      const targets: Record<string, Offset> = {
        ArrowLeft: { x: current.x - step, y: current.y },
        ArrowRight: { x: current.x + step, y: current.y },
        ArrowUp: { x: current.x, y: current.y - step },
        ArrowDown: { x: current.x, y: current.y + step },
      }
      if (targets[event.key]) {
        event.preventDefault()
        move(targets[event.key])
      } else if (event.key === 'Home') {
        event.preventDefault()
        reset()
      } else if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        setGrabbed(false)
        finish()
        setMessage(messages.dropped)
      } else if (event.key === 'Escape') {
        event.preventDefault()
        setOffset(keyStart.current)
        setGrabbed(false)
        setMessage(messages.cancelled)
      }
    },
  }

  return {
    style: { transform: `translate3d(${visual.x}px, ${visual.y}px, 0)` },
    dragging,
    grabbed,
    collapsed,
    message,
    handleProps,
  }
}
