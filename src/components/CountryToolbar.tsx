import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { features } from '../config/toolConfig'
import { downloadExcel, type DownloadTable } from '../download/download'
import { countryViews, type CountryView } from '../services/countryChart'
import { DownloadMenu } from './DownloadMenu'
import { EmbedButton } from './EmbedButton'
import { RoundButton } from './RoundButton'
import type { ToolbarIconName } from './ToolbarIcon'

const viewIcons: Record<CountryView, ToolbarIconName> = { bar: 'chart-bar', pie: 'chart-pie', line: 'chart-line' }

interface CountryToolbarProps {
  view: CountryView
  onViewChange: (view: CountryView) => void
  showTable: boolean
  onToggleTable: () => void
  onClose: () => void
  getTable?: () => DownloadTable
  title: string
  /** The dataset title, written on the downloaded image above `title`. */
  heading?: string
  /** Where the figures come from, written on the downloaded image. */
  source?: string
}

/**
 * The buttons of the top bar while a country is open. As in the original tool they replace the buttons of the main
 * view, in three groups: the views (bar, pie and line chart, table), the downloads (image, Excel, embed) and close.
 */
export function CountryToolbar({ view, onViewChange, showTable, onToggleTable, onClose, getTable, title, heading, source }: CountryToolbarProps) {
  const { t } = useTranslation()
  const [status, setStatus] = useState('')

  const saveExcel = async () => {
    if (!getTable) return
    setStatus(t('download.preparing'))
    setStatus((await downloadExcel(getTable())) ? t('download.done') : t('download.failed'))
  }

  return (
    <>
      <div className="toolbar-group">
        {countryViews.map((option) => (
          <RoundButton
            key={option}
            id={`country-view-${option}`}
            icon={viewIcons[option]}
            label={t(`country.view.${option}`)}
            aria-pressed={view === option && !showTable}
            // The chart that is showing is not clickable, and none is while the table is open (as in the original tool).
            disabled={showTable}
            aria-disabled={view === option && !showTable ? true : undefined}
            onClick={() => (view === option ? undefined : onViewChange(option))}
          />
        ))}
        <RoundButton
          id="country-view-table"
          icon={showTable ? viewIcons[view] : 'table'}
          label={t(showTable ? 'country.showChart' : 'country.showTable')}
          // The name says what the button does next (it changes), so it is not also a pressed toggle: the state would be told twice.
          data-active={showTable || undefined}
          onClick={onToggleTable}
        />
      </div>
      <div className="toolbar-group">
        {features.download && <DownloadMenu formats={['png', 'jpeg']} label={t('download.image')} heading={{ title: heading, subtitle: title, source }} />}
        {features.download && getTable && (
          <RoundButton id="excel-button" icon="excel" label={t('download.excelData')} onClick={() => void saveExcel()} />
        )}
        {features.share && features.embed && <EmbedButton title={title} />}
      </div>
      <div className="toolbar-group">
        <RoundButton id="country-close" icon="close" label={t('country.close')} onClick={onClose} />
      </div>
      <span className="ecl-u-sr-only" role="status" aria-live="polite">{status}</span>
    </>
  )
}
