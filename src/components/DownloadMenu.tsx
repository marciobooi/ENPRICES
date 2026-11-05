import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { downloadConfig } from '../config/toolConfig'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { downloadChartImage, downloadExcel, type DownloadFormat, type DownloadTable } from '../download/download'
import { RoundButton } from './RoundButton'

interface DownloadMenuProps {
  /**
   * The data of the chart for the Excel file. Without it the Excel entry is left out
   * (the image entries only need the chart on screen, see `downloadConfig.imageTarget`).
   */
  getTable?: () => DownloadTable
}

/**
 * Download button with a menu of formats: PNG or JPEG image of the chart and an Excel file of its data.
 * The entries come from `downloadConfig.formats`. The image is drawn from the chart on screen (html2canvas), so it
 * works for any chart library, Webtools' Highcharts wrapper included, with no export module or licence needed.
 * Focus stays in the menu while it is open; Escape or a click outside closes it.
 */
export function DownloadMenu({ getTable }: DownloadMenuProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const formats = downloadConfig.formats.filter((format) => format !== 'excel' || getTable)

  const close = (returnFocus: boolean) => {
    // Unmount first (releases the focus trap), then move focus back to the download button.
    flushSync(() => setOpen(false))
    if (returnFocus) wrapperRef.current?.querySelector<HTMLElement>('.round-button')?.focus()
  }

  useFocusTrap(popoverRef, {
    active: open,
    onDeactivate: () => close(true),
    returnFocus: false,
    closeOnOutsideClick: false,
  })

  // A click outside closes the menu and leaves focus on whatever was clicked.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) flushSync(() => setOpen(false))
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [open])

  const run = async (format: DownloadFormat) => {
    if (busy) return
    setBusy(true)
    setStatus(t('download.preparing'))
    // The menu must be gone before the image is drawn (and the page must have repainted without it).
    close(true)
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

    let done = false
    if (format === 'excel') done = getTable ? await downloadExcel(getTable()) : false
    else done = await downloadChartImage(format)

    setStatus(done ? t('download.done') : t('download.failed'))
    setBusy(false)
  }

  return (
    <div ref={wrapperRef} className="download-menu">
      <RoundButton
        id="download-button"
        icon="download"
        label={t('download.label')}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? 'download-popover' : undefined}
        onClick={() => (open ? close(false) : setOpen(true))}
      />
      {open && (
        <div
          id="download-popover"
          ref={popoverRef}
          className="share-popover download-popover"
          role="group"
          aria-label={t('download.label')}
        >
          <ul className="share-popover__list">
            {formats.map((format) => (
              <li key={format}>
                <button type="button" className="share-popover__link" onClick={() => void run(format)}>
                  {t(`download.${format}`)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Announces the progress and the result to screen readers after the menu has closed. */}
      <span className="ecl-u-sr-only" role="status" aria-live="polite">{status}</span>
    </div>
  )
}
