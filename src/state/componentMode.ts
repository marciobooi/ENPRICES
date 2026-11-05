import { energyDatasets } from '../config/toolConfig'
import type { FilterValues } from './filters'

/**
 * Switch between the semi-annual prices and the annual price components. They are different datasets, so the band,
 * the unit and the period are brought back to values the other dataset has, and the shares view starts again from
 * prices (as in the original tool). The menu selects follow, because they read the same values.
 */
export function switchComponentMode(
  values: FilterValues,
  enabled: boolean,
  onChange: (id: string, value: string | string[]) => void,
): void {
  const product = typeof values.product === 'string' ? values.product : '6000'
  const consumer = typeof values.consumer === 'string' ? values.consumer : 'HOUSEHOLD'
  const dataset = energyDatasets[`${product}_${consumer}` as keyof typeof energyDatasets]
  const units: readonly string[] = enabled ? dataset.componentsUnits : dataset.units
  const band = enabled ? dataset.defaultComponentsBand : dataset.defaultBand
  const currentYear = typeof values.time === 'string' ? values.time.slice(0, 4) : ''
  const thisYear = new Date().getFullYear()
  const unit = String(values.unit)

  onChange('component', enabled ? 'components' : 'total')
  onChange('percentage', 'value')
  onChange('band', band)
  onChange('unit', units.includes(unit) ? unit : units.includes('KWH') ? 'KWH' : units[0])
  // The latest period the new dataset has is chosen by the chart when this one is not available.
  onChange('time', enabled ? String(Math.min(Number(currentYear) || thisYear - 1, thisYear - 1)) : `${currentYear || thisYear}-S1`)
}
