import { useTranslation } from 'react-i18next'
import { allCountries, countryGroups, datasets, seriesColors, units } from '../config/toolConfig'
import { Card } from './Card'

/**
 * EXAMPLE content for the insights panel: same structure as a real tool's overview (hero, coverage figures,
 * how to read, key takeaways). The figures come from the tool config so the example is data-driven.
 * Replace the sections and the `insights.*` texts in the locale files with the tool's own.
 */
export function InsightsContent() {
  const { t } = useTranslation()
  const figures = {
    countries: allCountries.length,
    groups: countryGroups.length,
    units: Object.keys(units).length,
    datasets: Object.keys(datasets).length,
  }

  return (
    <>
      <section className="insights-hero">
        <p className="insights-kicker">{t('insights.kicker')}</p>
        <h3>{t('insights.heading')}</h3>
        <p>{t('insights.intro')}</p>
      </section>

      <section className="insights-section" aria-labelledby="insights-coverage-title">
        <h3 id="insights-coverage-title">{t('insights.coverageTitle')}</h3>
        <p>{t('insights.coverageText')}</p>
        <dl className="insights-kpis">
          <div><dt>{t('insights.kpiCountries')}</dt><dd>{figures.countries}</dd></div>
          <div><dt>{t('insights.kpiGroups')}</dt><dd>{figures.groups}</dd></div>
          <div><dt>{t('insights.kpiUnits')}</dt><dd>{figures.units}</dd></div>
          <div><dt>{t('insights.kpiDatasets')}</dt><dd>{figures.datasets}</dd></div>
        </dl>
      </section>

      <section className="insights-section" aria-labelledby="insights-groups-title">
        <h3 id="insights-groups-title">{t('insights.groupsTitle')}</h3>
        <p>{t('insights.groupsText')}</p>
        <div className="card-grid">
          {countryGroups.map(({ id, codes }, index) => (
            <Card
              key={id}
              headingLevel={4}
              title={t(`countryGroups.${id}`)}
              accentColor={seriesColors[index % seriesColors.length]}
              footer={t('insights.groupCountries', { count: codes.length })}
            >
              {codes.slice(0, 3).map((code) => t(`countries.${code}`)).join(', ')}
              {codes.length > 3 ? '…' : ''}
            </Card>
          ))}
        </div>
      </section>

      <section className="insights-section" aria-labelledby="insights-read-title">
        <h3 id="insights-read-title">{t('insights.readTitle')}</h3>
        <p>{t('insights.readIntro')}</p>
        <ul className="ecl-unordered-list">
          <li className="ecl-unordered-list__item"><strong>{t('insights.rising')}</strong>: {t('insights.risingText')}</li>
          <li className="ecl-unordered-list__item"><strong>{t('insights.falling')}</strong>: {t('insights.fallingText')}</li>
          <li className="ecl-unordered-list__item"><strong>{t('insights.stable')}</strong>: {t('insights.stableText')}</li>
        </ul>
      </section>

      <section className="insights-section insights-takeaways" aria-labelledby="insights-takeaways-title">
        <h3 id="insights-takeaways-title">{t('insights.takeawaysTitle')}</h3>
        <ul className="ecl-unordered-list">
          <li className="ecl-unordered-list__item">{t('insights.takeaway1', { countries: figures.countries, groups: figures.groups })}</li>
          <li className="ecl-unordered-list__item">{t('insights.takeaway2', { units: figures.units })}</li>
          <li className="ecl-unordered-list__item">{t('insights.takeaway3')}</li>
        </ul>
      </section>
    </>
  )
}
