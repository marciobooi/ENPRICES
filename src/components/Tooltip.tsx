import {
  cloneElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactElement,
} from 'react'

interface TooltipProps {
  content: string
  /** Dark bubble instead of the default white one with a blue border. */
  inverted?: boolean
  /** Link the bubble to the trigger with aria-describedby. Turn off when the text only repeats the accessible name. */
  announce?: boolean
  children: ReactElement<HTMLAttributes<HTMLElement>>
}

const SHOW_DELAY_MS = 150
/** Moving to a neighbouring trigger within this window shows its tooltip with no delay. */
const HANDOVER_MS = 400
const VIEWPORT_MARGIN = 8

// Only one tooltip is ever visible: opening one closes the previous one immediately.
let closeActive: (() => void) | null = null
let lastClosedAt = 0

export function Tooltip({ content, inverted = false, announce = true, children }: TooltipProps) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const [shift, setShift] = useState(0)
  const timer = useRef<number | undefined>(undefined)
  const bubbleRef = useRef<HTMLSpanElement>(null)
  // Identity of this instance's `hide`, readable inside `hide` itself without capturing it during initialisation.
  const self = useRef<(() => void) | null>(null)

  const hide = useCallback(() => {
    window.clearTimeout(timer.current)
    if (closeActive === self.current) {
      closeActive = null
      lastClosedAt = Date.now()
    }
    setVisible(false)
    setShift(0)
  }, [])

  const show = useCallback(
    (instant: boolean) => {
      window.clearTimeout(timer.current)
      const open = () => {
        if (closeActive && closeActive !== hide) closeActive()
        closeActive = hide
        setVisible(true)
      }
      if (instant || Date.now() - lastClosedAt < HANDOVER_MS || closeActive) open()
      else timer.current = window.setTimeout(open, SHOW_DELAY_MS)
    },
    [hide],
  )

  useEffect(() => {
    self.current = hide
    return hide
  }, [hide])

  // Keep the bubble inside the viewport (buttons near the screen edge).
  useLayoutEffect(() => {
    if (!visible || !bubbleRef.current) return
    const { left, right } = bubbleRef.current.getBoundingClientRect()
    if (left < VIEWPORT_MARGIN) setShift(VIEWPORT_MARGIN - left)
    else if (right > window.innerWidth - VIEWPORT_MARGIN) setShift(window.innerWidth - VIEWPORT_MARGIN - right)
  }, [visible])

  // Keep any description the trigger already has and add the tooltip while it is visible.
  const describedBy =
    [children.props['aria-describedby'], visible && announce ? id : undefined].filter(Boolean).join(' ') || undefined

  return (
    <span
      className="tooltip-host"
      onPointerEnter={(event) => {
        if (event.pointerType !== 'touch') show(false)
      }}
      onPointerLeave={hide}
      onPointerDown={hide}
      onFocus={(event) => {
        // Keyboard focus only: a mouse click must not leave a tooltip stuck on the button.
        if (event.target instanceof HTMLElement && event.target.matches(':focus-visible')) show(true)
      }}
      onBlur={hide}
      onKeyDown={(event) => {
        if (event.key === 'Escape') hide()
      }}
    >
      {cloneElement(children, { 'aria-describedby': describedBy })}
      {visible && (
        <span
          ref={bubbleRef}
          id={id}
          role="tooltip"
          className={`tooltip-bubble${inverted ? ' tooltip-bubble--inverted' : ''}`}
          style={{ '--tooltip-shift': `${shift}px` } as React.CSSProperties}
        >
          {content}
        </span>
      )}
    </span>
  )
}
