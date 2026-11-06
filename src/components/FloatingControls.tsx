import { useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AGGREGATES_COUNTRY_CODES } from '../config/toolConfig'
import { useDraggableToolbar } from '../hooks/useDraggableToolbar'
import { useRovingToolbar } from '../hooks/useRovingToolbar'
import { resolveEnergyQuery } from '../hooks/useEnergyPrices'
import { nextDecimals, priceDecimals } from '../services/decimals'
import { switchComponentMode } from '../state/componentMode'
import type { FilterValues } from '../state/filters'
import { RoundButton } from './RoundButton'
import { SortMenu } from './SortMenu'
import { ToolbarIcon } from './ToolbarIcon'

interface FloatingControlsProps {
  values: FilterValues
  onChange: (id: string, value: string | string[]) => void
  showTable: boolean
  onToggleTable: () => void
}

/**
 * The floating bar of the main chart, as in the original tool: the detail and components switches, then percentage
 * (only with the detail), the EU and euro-area columns, the order of the countries and the table. It can be moved
 * (drag the handle, or pick it up with Space and use the arrow keys) and is one Tab stop whose controls the arrow
 * keys walk through. It belongs to the main chart only: the charts opened from a country have their own toolbar.
 */
export function FloatingControls({ values, onChange, showTable, onToggleTable }: FloatingControlsProps) {
  const { t } = useTranslation()
  const helpId = useId()
  const detailed = values.breakdown === 'components'
  const components = values.component === 'components'
  const percentage = values.percentage === 'percentage'
  const geo = Array.isArray(values.geo) ? values.geo : []
  const hasAggregates = AGGREGATES_COUNTRY_CODES.every((code) => geo.includes(code))

  const messages = useMemo(
    () => ({ picked: t('controls.picked'), dropped: t('controls.dropped'), cancelled: t('controls.cancelled'), reset: t('controls.resetDone'), collapsed: t('controls.collapsed'), expanded: t('controls.expanded') }),
    [t],
  )
  const barRef = useRef<HTMLDivElement>(null)
  const drag = useDraggableToolbar(barRef, messages)
  const roving = useRovingToolbar(barRef)

  // Decimals of every price (4, 3, 2, 1, 4, ...). MWh prices are whole numbers, so the button has nothing to change there.
  const wholeNumbers = resolveEnergyQuery(values).unit === 'MWH'
  const decimals = priceDecimals(wholeNumbers ? 'KWH' : resolveEnergyQuery(values).unit, values)
  const next = nextDecimals(decimals)
  const [decimalsMessage, setDecimalsMessage] = useState('')

  return (
    <div
      ref={barRef}
      className={`floating-controls${drag.dragging ? ' floating-controls--dragging' : ''}${drag.grabbed ? ' floating-controls--grabbed' : ''}${showTable ? ' floating-controls--inflow' : ''}${drag.collapsed ? ' floating-controls--collapsed' : ''}`}
      style={drag.style}
      role="toolbar"
      aria-label={t('controls.label')}
      onFocus={roving.onFocus}
      onKeyDown={roving.onKeyDown}
    >
      <button
        type="button"
        id="chart-move"
        className="floating-controls__handle"
        aria-label={t('controls.move')}
        aria-describedby={helpId}
        aria-pressed={drag.grabbed}
        aria-expanded={!drag.collapsed}
        {...drag.handleProps}
      >
        <ToolbarIcon name="grip" />
      </button>
      <span id={helpId} className="ecl-u-sr-only">{t('controls.moveHelp')}</span>

      {!drag.collapsed && (
        <>
        {!showTable && (
          <div className="floating-controls__switches">
            <Switch
              id="chart-details"
              checked={detailed}
              hideLabel={t('controls.detailsHide')}
              showLabel={t('controls.detailsShow')}
              onChange={(checked) => {
                onChange('breakdown', checked ? 'components' : 'total')
                if (!checked) onChange('percentage', 'value')
              }}
            />
            <Switch
              id="components-toggle"
              checked={components}
              hideLabel={t('componentModes.hide')}
              showLabel={t('componentModes.show')}
              onChange={(checked) => switchComponentMode(values, checked, onChange)}
            />
          </div>
        )}

        <div className="floating-controls__buttons">
          {!showTable && detailed && (
            <RoundButton
              id="chart-percentage"
              icon="percent"
              label={t(percentage ? 'controls.percentageHide' : 'controls.percentageShow')}
              aria-pressed={percentage}
              onClick={() => onChange('percentage', percentage ? 'value' : 'percentage')}
            />
          )}
          {!showTable && (
            <RoundButton
              id="chart-aggregates"
              icon="layers"
              label={t(hasAggregates ? 'controls.aggregatesHide' : 'controls.aggregatesShow')}
              aria-pressed={hasAggregates}
              onClick={() => onChange(
                'geo',
                hasAggregates
                  ? geo.filter((code) => !AGGREGATES_COUNTRY_CODES.includes(code))
                  : [...AGGREGATES_COUNTRY_CODES.filter((code) => !geo.includes(code)), ...geo],
              )}
            />
          )}
          {!showTable && (
            <SortMenu value={typeof values.order === 'string' ? values.order : 'desc'} onChange={(order) => onChange('order', order)} />
          )}
          {!showTable && (
            <RoundButton
              id="chart-decimals"
              icon="decimals"
              data-digits={decimals}
              label={wholeNumbers ? t('controls.decimalsWhole') : t('controls.decimalsLabel', { count: decimals, next })}
              aria-disabled={wholeNumbers || undefined}
              onClick={() => {
                if (wholeNumbers) return
                onChange('decimals', String(next))
                // Announced, because nothing else tells a screen reader that every figure changed.
                setDecimalsMessage(t('controls.decimalsSet', { count: next }))
              }}
            />
          )}
          <RoundButton
            id="chart-table"
            icon={showTable ? 'chart-bar' : 'table'}
            label={t(showTable ? 'country.showChart' : 'country.showTable')}
            aria-pressed={showTable}
            onClick={onToggleTable}
          />
        </div>
        </>
      )}

      <span className="ecl-u-sr-only" role="status" aria-live="polite">{drag.message}</span>
      <span className="ecl-u-sr-only" role="status" aria-live="polite">{decimalsMessage}</span>
    </div>
  )
}

interface SwitchProps {
  id: string
  checked: boolean
  /** The text of the "off" side and of the "on" side, as in the original tool ("Hide details" | switch | "Show details"). */
  hideLabel: string
  showLabel: string
  onChange: (checked: boolean) => void
}

/**
 * A switch with a label on each side; the side that is active is in bold. The visible words only repeat what the
 * switch says, so they are hidden from screen readers, which get the action the switch will do.
 */
function Switch({ id, checked, hideLabel, showLabel, onChange }: SwitchProps) {
  return (
    <div className="switch-row">
      <span className={`switch-row__label${checked ? '' : ' switch-row__label--on'}`} aria-hidden="true" onClick={() => onChange(false)}>{hideLabel}</span>
      <input
        id={id}
        className="switch"
        type="checkbox"
        role="switch"
        checked={checked}
        // One fixed name: a switch already announces on or off, so a name that changes with the state would be read twice.
        aria-label={showLabel}
        onChange={(event) => onChange(event.target.checked)}
        // Space is the checkbox's own key; Enter also works, as the switch pattern allows.
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            onChange(!checked)
          }
        }}
      />
      <span className={`switch-row__label${checked ? ' switch-row__label--on' : ''}`} aria-hidden="true" onClick={() => onChange(true)}>{showLabel}</span>
    </div>
  )
}
