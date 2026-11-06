import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

/** The sizes of the ECL spinner. */
const SIZE_CLASS = { small: 's', medium: 'm', large: 'l' } as const

/** The parameters of the ECL loading indicator (text, overlay, size, centered) plus `loading` and `variant`. */
interface LoadingProps {
  /** Show the spinner. Default true. The live region stays in the page, so the text is announced when it appears. */
  loading?: boolean
  /** ECL `size`: small, medium (default) or large. */
  size?: keyof typeof SIZE_CLASS
  /** ECL `text`, content: the text below the loading indicator. Default: `loading.text` from the locale files. */
  text?: string
  /** ECL `text`, display: show the text on screen (default). When false it is kept for screen readers only. */
  showText?: boolean
  /** ECL `centered`: centred horizontally at the top of the nearest positioned container (a card, a chart frame). */
  centered?: boolean
  /** Fill the area of the content (about 60% of the window high) and put the spinner in the middle of it. */
  stage?: boolean
  /** ECL `overlay`: cover the page with a white overlay and centre the spinner. Mouse and keyboard are blocked. */
  overlay?: boolean
  /** `inverted` is white, for dark backgrounds. */
  variant?: 'primary' | 'inverted'
  className?: string
}

/**
 * Loading indicator on the ECL spinner (`ecl-spinner`).
 *
 * Differences from ECL's markup: the container is a polite `role="status"` (ECL's `role="alert"` interrupts screen
 * readers), and the spinner stops turning for people who ask for reduced motion (see App.css); the text stays.
 */
export function Loading({
  loading = true,
  size = 'medium',
  text,
  showText = true,
  centered = false,
  stage = false,
  overlay = false,
  variant = 'primary',
  className = '',
}: LoadingProps) {
  const { t } = useTranslation()
  const label = text ?? t('loading.text')
  const covering = overlay && loading

  // An overlay lives outside #root, so the page behind can be made inert (no Tab, no click) while the spinner
  // itself stays readable. If something else (the tour) already made it inert, that is left alone.
  useEffect(() => {
    if (!covering) return
    const root = document.getElementById('root')
    if (!root || root.hasAttribute('inert')) return
    root.setAttribute('inert', '')
    return () => root.removeAttribute('inert')
  }, [covering])

  const spinner = (
    <div
      className={`ecl-spinner ecl-spinner--${variant} ecl-spinner--${SIZE_CLASS[size]} ecl-spinner--visible${centered || overlay ? ' ecl-spinner--centered' : ''} ${className}`.trim()}
      {...(covering ? { role: 'status', 'aria-live': 'polite' as const } : {})}
    >
      <svg className="ecl-spinner__loader" viewBox="25 25 50 50" aria-hidden="true" focusable="false">
        <circle
          className="ecl-spinner__circle"
          cx="50"
          cy="50"
          r="20"
          fill="none"
          strokeWidth="4px"
          strokeMiterlimit="10"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className={`ecl-spinner__text${showText ? '' : ' ecl-u-sr-only'}`}>{label}</div>
    </div>
  )

  if (covering) {
    return createPortal(
      <>
        <div className="ecl-spinner__overlay ecl-spinner__overlay--visible" />
        {spinner}
      </>,
      document.body,
    )
  }

  return (
    <div role="status" aria-live="polite" className={`loading${stage && loading ? ' loading--stage' : ''}`}>
      {loading && spinner}
    </div>
  )
}
