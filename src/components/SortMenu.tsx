import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { sortOrders } from '../config/toolConfig'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { RoundButton } from './RoundButton'
import { ToolbarIcon } from './ToolbarIcon'

interface SortMenuProps {
  value: string
  onChange: (order: string) => void
}

/**
 * Round sort button with a menu of the country orders (as in the original tool). Built like the download menu: focus
 * stays in the menu while it is open, Escape or a click outside closes it and focus returns to the button.
 */
export function SortMenu({ value, onChange }: SortMenuProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const close = (returnFocus: boolean) => {
    flushSync(() => setOpen(false))
    if (returnFocus) wrapperRef.current?.querySelector<HTMLElement>('.round-button')?.focus()
  }

  useFocusTrap(popoverRef, {
    active: open,
    onDeactivate: () => close(true),
    returnFocus: false,
    closeOnOutsideClick: false,
  })

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) flushSync(() => setOpen(false))
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [open])

  return (
    <div ref={wrapperRef} className="download-menu">
      <RoundButton
        id="chart-order"
        icon="sort"
        label={t('controls.order')}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? 'sort-popover' : undefined}
        onClick={() => (open ? close(false) : setOpen(true))}
      />
      {open && (
        <div id="sort-popover" ref={popoverRef} className="share-popover download-popover" role="group" aria-label={t('controls.order')}>
          <ul className="share-popover__list">
            {sortOrders.map((order) => (
              <li key={order}>
                <button
                  type="button"
                  className="share-popover__link sort-menu__option"
                  aria-current={value === order ? 'true' : undefined}
                  onClick={() => {
                    onChange(order)
                    close(true)
                  }}
                >
                  {/* A slot of the same width for every option, so the names line up; the check marks the current order */}
                  <span className="sort-menu__check" aria-hidden="true">{value === order && <ToolbarIcon name="check" />}</span>
                  <span>{t(`orders.${order}`)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
