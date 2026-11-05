import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { buildEmbedCode, buildEmbedUrl } from '../embed/embed'
import { InsightsPanel } from './InsightsPanel'
import { RoundButton } from './RoundButton'

/** Round "embed" button with the dialog that shows the `<iframe>` code of the current view (the address carries it all). */
export function EmbedButton({ title }: { title: string }) {
  const { t } = useTranslation()
  const [code, setCode] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code ?? '')
      setStatus(t('embed.copied'))
    } catch {
      setStatus(t('embed.copyFailed'))
    }
  }

  return (
    <>
      <RoundButton
        id="embed-button"
        icon="embed"
        label={t('embed.menu')}
        aria-haspopup="dialog"
        onClick={() => {
          setStatus('')
          setCode(buildEmbedCode({ url: buildEmbedUrl(), title }))
        }}
      />
      <InsightsPanel id="embedDialog" narrow open={code !== null} onClose={() => setCode(null)} title={t('embed.title')} closeLabel={t('embed.close')}>
        <p>{t('embed.description')}</p>
        <label className="ecl-form-label" htmlFor="embed-code">{t('embed.codeLabel')}</label>
        <textarea
          id="embed-code"
          className="ecl-text-area embed-code"
          readOnly
          rows={5}
          value={code ?? ''}
          onFocus={(event) => event.currentTarget.select()}
        />
        <div className="embed-actions">
          <button type="button" className="ecl-button ecl-button--primary" onClick={() => void copy()}>{t('embed.copy')}</button>
          <p className="embed-status" role="status">{status}</p>
        </div>
      </InsightsPanel>
    </>
  )
}
