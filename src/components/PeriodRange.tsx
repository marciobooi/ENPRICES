import { useId } from 'react'
import { Trans, useTranslation } from 'react-i18next'

interface PeriodRangeProps {
  /** Every period the line chart has, oldest first. */
  periods: string[]
  /** The range that is set: a period, or empty for "from the first" / "to the last". */
  from: string
  to: string
  onChange: (from: string, to: string) => void
}

/** Position of `value` in `periods`, or of the nearest period inside them when it is not one of them. */
function indexOfPeriod(periods: string[], value: string, fallback: number): number {
  if (!value) return fallback
  const exact = periods.indexOf(value)
  if (exact >= 0) return exact
  const next = periods.findIndex((period) => period >= value)
  return next === -1 ? periods.length - 1 : next
}

/**
 * Two sliders on one track that choose the first and the last period of the line chart. They are native range inputs
 * (keyboard: arrow keys, Home, End, Page Up and Down; screen readers read the period as the value), drawn with the ECL
 * blue. The first can never pass the last, so the chart always has at least two periods.
 */
export function PeriodRange({ periods, from, to, onChange }: PeriodRangeProps) {
  const { t } = useTranslation()
  const sentenceId = useId()
  const last = periods.length - 1
  if (last < 1) return null

  const low = Math.min(indexOfPeriod(periods, from, 0), last - 1)
  const high = Math.max(indexOfPeriod(periods, to, last), low + 1)
  // Open ends stay empty in the address, so a link says "all periods" and keeps saying it when new data comes.
  const set = (nextLow: number, nextHigh: number) => onChange(nextLow <= 0 ? '' : periods[nextLow], nextHigh >= last ? '' : periods[nextHigh])
  // A thumb is 14px wide, so the track a thumb can travel is 14px shorter than the slider.
  const at = (index: number) => `calc(${(index / last) * 100}% + ${7 - (index / last) * 14}px)`

  return (
    <div className="period-range">
      <div className="period-range__track">
        <div className="period-range__bar" style={{ left: at(low), right: `calc(100% - ${at(high)})` }} />
        <input
          type="range"
          className="period-range__input"
          min={0}
          max={last}
          step={1}
          value={low}
          aria-label={t('country.rangeFrom')}
          aria-valuetext={periods[low]}
          aria-describedby={sentenceId}
          onChange={(event) => set(Math.min(Number(event.target.value), high - 1), high)}
        />
        <input
          type="range"
          className="period-range__input"
          min={0}
          max={last}
          step={1}
          value={high}
          aria-label={t('country.rangeTo')}
          aria-valuetext={periods[high]}
          aria-describedby={sentenceId}
          onChange={(event) => set(low, Math.max(Number(event.target.value), low + 1))}
        />
      </div>
      <p id={sentenceId} className="period-range__sentence" role="status" aria-live="polite">
        <Trans i18nKey="country.periodFiltered" values={{ from: periods[low], to: periods[high] }} components={{ b: <strong /> }} />
      </p>
    </div>
  )
}
