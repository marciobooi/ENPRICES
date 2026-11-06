import type { FilterValues } from '../state/filters'

/** The decimals the button of the floating bar goes through, in the order of its clicks. */
export const DECIMAL_STEPS = [4, 3, 2, 1] as const

/**
 * Decimals of a price: the chosen number (4 unless changed), or none for MWh, where prices are whole numbers as in the
 * original tool. Charts, tooltips and tables all take it from here, so they always agree.
 */
export function priceDecimals(unit: string, values: FilterValues): number {
  if (unit === 'MWH') return 0
  const chosen = Number(typeof values.decimals === 'string' ? values.decimals : DECIMAL_STEPS[0])
  return (DECIMAL_STEPS as readonly number[]).includes(chosen) ? chosen : DECIMAL_STEPS[0]
}

/** The step after `current` (4, 3, 2, 1, then 4 again). */
export function nextDecimals(current: number): number {
  const index = (DECIMAL_STEPS as readonly number[]).indexOf(current)
  return DECIMAL_STEPS[(index + 1) % DECIMAL_STEPS.length]
}
