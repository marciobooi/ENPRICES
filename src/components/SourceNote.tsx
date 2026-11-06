import { useTranslation } from 'react-i18next'
import { eurostatDatasetUrl } from '../config/toolConfig'

interface SourceNoteProps {
  /** Code of the Eurostat dataset the chart draws (e.g. `nrg_pc_204`). */
  dataset: string
}

/** "Source: Eurostat - access to dataset", under every chart: where the figures come from, with the link to them. */
export function SourceNote({ dataset }: SourceNoteProps) {
  const { t, i18n } = useTranslation()
  return (
    <p className="source-note">
      {t('source.label')} -{' '}
      <a className="ecl-link" href={eurostatDatasetUrl(dataset, i18n.resolvedLanguage ?? 'en')} target="_blank" rel="noopener">
        {t('source.link')}
        <span className="ecl-u-sr-only"> {t('source.newTab')}</span>
      </a>
    </p>
  )
}
