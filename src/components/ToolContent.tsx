import { useTranslation } from 'react-i18next'
import { embedConfig, filters } from '../config/toolConfig'
import { describeFilter, type FilterValues } from '../state/filters'
import { Card } from './Card'

interface ToolContentProps {
  /** Which chart to show: the page shows the main one; an embedded view shows the chart named in `?embed=`. */
  chartId?: string
  /** The filters in force (from the address). */
  values: FilterValues
  /** Heading level of the chart title: 2 under the banner's h1, 1 in an embedded view that has no banner. */
  headingLevel?: 1 | 2
}

/**
 * The main content of the tool, shown in the page AND in the embedded view. EXAMPLE: this card stands in for the
 * tool's main chart and lists the filters in force; replace it and add one branch per chart id of `embedConfig.charts`.
 */
export function ToolContent({ chartId = embedConfig.defaultChart, values, headingLevel = 2 }: ToolContentProps) {
  const { t } = useTranslation()

  if (!embedConfig.charts.includes(chartId)) {
    return <p className="tool-content__message" role="alert">{t('toolContent.unknownChart')}</p>
  }

  return (
    <div className="tool-content">
      <Card
        headingLevel={headingLevel}
        title={t('toolContent.title')}
        description={t('toolContent.description')}
        footer={t('toolContent.hint')}
      >
        <dl className="tool-content__selection">
          {filters.map((definition) => (
            <div key={definition.id}>
              <dt>{t(`filters.${definition.id}`)}</dt>
              <dd>{describeFilter(definition, values[definition.id], t)}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  )
}
