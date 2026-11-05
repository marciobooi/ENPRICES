import { useEffect, useId, useRef, type ReactNode } from 'react'
import { useFocusTrap } from '../hooks/useFocusTrap'

interface InsightsPanelProps {
  open: boolean
  onClose: () => void
  title: string
  closeLabel: string
  children: ReactNode
  /** A narrow dialog for short content (e.g. the embed code). */
  narrow?: boolean
  id?: string
}

/**
 * Full-height insights overlay on a native modal `<dialog>`: the browser keeps focus inside, makes the page behind
 * inert, closes on Escape and returns focus to the button that opened it. Clicking the backdrop closes it too.
 */
export function InsightsPanel({ open, onClose, title, closeLabel, children, narrow = false, id = 'insightsOverlay' }: InsightsPanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  // The native dialog keeps the page behind inert, handles Escape and returns focus to the opener; the trap
  // additionally keeps Tab cycling inside the panel instead of leaving to the browser's own controls.
  useFocusTrap(panelRef, {
    active: open,
    initialFocus: false,
    returnFocus: false,
    closeOnEscape: false,
    closeOnOutsideClick: false,
  })

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      id={id}
      className={`insights-dialog${narrow ? ' insights-dialog--narrow' : ''}`}
      aria-labelledby={titleId}
      onClose={onClose}
      // Only a click on the backdrop itself (the dialog element) closes; clicks inside the panel do not.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      {open && (
        <div ref={panelRef} className="insights-dialog__panel">
          <div className="insights-header">
            <h2 className="insights-dialog__title" id={titleId}>{title}</h2>
            <button type="button" className="ecl-button ecl-button--secondary" onClick={onClose}>
              {closeLabel}
            </button>
          </div>
          {/* Scrollable, so it must be reachable with the keyboard */}
          <div className="insights-body" tabIndex={0} role="region" aria-labelledby={titleId}>
            {children}
          </div>
        </div>
      )}
    </dialog>
  )
}
