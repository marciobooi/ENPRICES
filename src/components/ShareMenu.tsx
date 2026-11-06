import { useId, useRef, useState, type MouseEvent } from 'react'
import { flushSync } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { useOutsideClose } from '../hooks/useOutsideClose'
import { features } from '../config/toolConfig'
import { buildEmbedCode, buildEmbedUrl } from '../embed/embed'
import { buildContactEmail, type EmailDetail } from '../share/email'
import { openSharePopup, shareNetworks, type ShareContent, type ShareNetwork } from '../share/networks'
import { captureViewport, copyImageToClipboard, downloadImage } from '../share/screenshot'
import { InsightsPanel } from './InsightsPanel'
import { Loading } from './Loading'
import { RoundButton } from './RoundButton'
import { WebtoolsIcon } from './WebtoolsIcon'

/** The current page without the #fragment (a link to a section is not what people expect to share). */
function shareableUrl(): string {
  const address = new URL(window.location.href)
  address.hash = ''
  return address.toString()
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

interface ShareMenuProps {
  /** Address to share. Default: the current page. */
  url?: string
  /** Default: the tool name (`brand`). */
  title?: string
  /** Default: `share.text` from the locale files (describe the tool there). */
  text?: string
  /** Tool-specific context added to the contact e-mail, e.g. the selected filters. */
  emailDetails?: EmailDetail[]
}

/**
 * Share button with a popover of social networks (X, Facebook, LinkedIn), a contact e-mail and "copy link".
 * Networks live in src/share/networks.ts, names and texts in the locale files, icons come from Webtools.
 * Focus stays in the popover while it is open; Escape or a click outside closes it.
 *
 * The e-mail goes to the fixed Eurostat mailbox (CONTACT_EMAIL) with the tool, address, language, date, filters,
 * window size and browser filled in, and a screenshot of the current view on the clipboard (a `mailto:` link cannot
 * carry an attachment, so the person pastes it into the message).
 */
export function ShareMenu({ url, title, text, emailDetails = [] }: ShareMenuProps) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [embedCode, setEmbedCode] = useState<string | null>(null)
  const [embedStatus, setEmbedStatus] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  const close = (returnFocus: boolean) => {
    // Unmount first (releases the focus trap), then move focus back to the share button.
    flushSync(() => {
      setOpen(false)
      setStatus('')
    })
    if (returnFocus) wrapperRef.current?.querySelector<HTMLElement>('.round-button')?.focus()
  }

  useFocusTrap(popoverRef, {
    active: open,
    onDeactivate: () => close(true),
    returnFocus: false,
    closeOnOutsideClick: false,
  })


  // A click outside closes the popover and leaves focus on whatever was clicked.
  useOutsideClose(wrapperRef, open, () => {
    setOpen(false)
    setStatus('')
  })

  const content = (): ShareContent => ({
    url: url ?? shareableUrl(),
    title: title ?? t('brand'),
    text: text ?? t('share.text'),
  })

  const onNetworkClick = (event: MouseEvent<HTMLAnchorElement>, network: ShareNetwork) => {
    // Keep the browser's own behaviour for modified clicks (new tab, new window).
    if (!network.popup || event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return
    event.preventDefault()
    openSharePopup(network.href(content()), network.popup)
    close(true)
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(content().url)
      setStatus(t('share.linkCopied'))
    } catch {
      setStatus(t('share.copyFailed'))
    }
  }

  // The embed code carries the whole state of the tool (it is in the address), so it shows what the person sees now.
  const openEmbed = () => {
    setEmbedStatus('')
    setEmbedCode(buildEmbedCode({ url: buildEmbedUrl(), title: content().title }))
    close(false)
  }

  const closeEmbed = () => {
    setEmbedCode(null)
    wrapperRef.current?.querySelector<HTMLElement>('.round-button')?.focus()
  }

  const copyEmbedCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCode ?? '')
      setEmbedStatus(t('embed.copied'))
    } catch {
      setEmbedStatus(t('embed.copyFailed'))
    }
  }

  const sendEmail = async () => {
    if (busy) return
    setBusy(true)
    await nextFrame()

    const { url: address, title: tool } = content()
    const language = (i18n.resolvedLanguage ?? 'en').toUpperCase()

    // Screenshot of what the person sees: on the clipboard to paste, or saved as a file when the clipboard refuses.
    let screenshotNote = t('share.email.screenshotNone')
    const image = await captureViewport()
    if (image) {
      if (await copyImageToClipboard(image)) {
        screenshotNote = t('share.email.screenshotCopied')
      } else {
        const file = `${tool.replace(/[^\w-]+/g, '-').toLowerCase()}-screenshot.png`
        downloadImage(image, file)
        screenshotNote = t('share.email.screenshotSaved', { file })
      }
    }

    // Most useful first: the link drops the last lines when a mail client could not take a longer message.
    const details: EmailDetail[] = [
      { label: t('share.email.tool'), value: tool },
      { label: t('share.email.address'), value: address },
      { label: t('share.email.language'), value: language },
      ...emailDetails,
      { label: t('share.email.date'), value: new Date().toLocaleString(i18n.resolvedLanguage) },
      { label: t('share.email.window'), value: `${window.innerWidth} x ${window.innerHeight}` },
      { label: t('share.email.browser'), value: navigator.userAgent },
    ]

    window.location.href = buildContactEmail({
      subject: tool,
      greeting: t('share.email.greeting'),
      yourMessage: t('share.email.yourMessage'),
      contextHeading: t('share.email.contextHeading'),
      details,
      screenshotNote,
    })
    setBusy(false)
    close(true)
  }

  return (
    <div ref={wrapperRef} className="share-menu">
      <RoundButton
        id="share-button"
        icon="share"
        label={t('share.label')}
        aria-expanded={open}
        aria-controls={open ? 'share-popover' : undefined}
        onClick={() => (open ? close(false) : setOpen(true))}
      />
      {open && (
        <div id="share-popover" ref={popoverRef} className="share-popover" role="group" aria-labelledby={titleId}>
          <p id={titleId} className="share-popover__title">{t('share.title')}</p>
          <ul className="share-popover__list">
            {shareNetworks.map((network) => (
              <li key={network.id}>
                {network.email ? (
                  <button
                    type="button"
                    className="ecl-link ecl-link--standalone share-popover__link"
                    disabled={busy}
                    onClick={() => void sendEmail()}
                  >
                    <WebtoolsIcon set="networks" name={network.icon} />
                    <span className="ecl-link__label">{t(`share.networks.${network.id}`)}</span>
                  </button>
                ) : (
                  <a
                    className="ecl-link ecl-link--standalone share-popover__link"
                    href={network.href(content())}
                    target="_blank"
                    rel="noopener"
                    onClick={(event) => onNetworkClick(event, network)}
                  >
                    <WebtoolsIcon set="networks" name={network.icon} />
                    <span className="ecl-link__label">{t(`share.networks.${network.id}`)}</span>
                    <span className="ecl-u-sr-only"> {t('share.opensNewWindow')}</span>
                  </a>
                )}
              </li>
            ))}
            <li>
              <button type="button" className="ecl-link ecl-link--standalone share-popover__link" onClick={() => void copyLink()}>
                <WebtoolsIcon set="phosphor" name="copy" />
                <span className="ecl-link__label">{t('share.copyLink')}</span>
              </button>
            </li>
            {features.embed && (
              <li>
                <button type="button" className="ecl-link ecl-link--standalone share-popover__link" onClick={openEmbed}>
                  <WebtoolsIcon set="phosphor" name="code" />
                  <span className="ecl-link__label">{t('embed.menu')}</span>
                </button>
              </li>
            )}
          </ul>
          {busy && <Loading size="small" text={t('share.email.preparing')} />}
          <p className="share-popover__status" role="status">{status}</p>
        </div>
      )}
      <InsightsPanel
        id="embedDialog"
        narrow
        open={embedCode !== null}
        onClose={closeEmbed}
        title={t('embed.title')}
        closeLabel={t('embed.close')}
      >
        <p>{t('embed.description')}</p>
        <label className="ecl-form-label" htmlFor="embed-code">{t('embed.codeLabel')}</label>
        <textarea
          id="embed-code"
          className="ecl-text-area embed-code"
          readOnly
          rows={5}
          value={embedCode ?? ''}
          onFocus={(event) => event.currentTarget.select()}
        />
        <div className="embed-actions">
          <button type="button" className="ecl-button ecl-button--primary" onClick={() => void copyEmbedCode()}>
            {t('embed.copy')}
          </button>
          <p className="embed-status" role="status">{embedStatus}</p>
        </div>
      </InsightsPanel>
    </div>
  )
}
