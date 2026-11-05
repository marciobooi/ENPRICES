import { useCallback } from 'react'
import type { TFunction } from 'i18next'
import { filters, type FilterDefinition, type FilterGroup } from '../config/toolConfig'
import { listParam, stringParam, useUrlState, type ParamSet } from './urlState'

/** The current value of every filter, by filter id: a code for a select, a list of codes for a multiselect. */
export type FilterValues = Record<string, string | string[]>

const isGroupList = (options: readonly string[] | readonly FilterGroup[]): options is readonly FilterGroup[] =>
  options.length > 0 && typeof options[0] !== 'string'

/** Every code a filter accepts, groups flattened. */
export function filterCodes(definition: FilterDefinition): string[] {
  if (definition.type === 'select') return [...definition.options]
  return isGroupList(definition.options)
    ? definition.options.flatMap((group) => [...group.codes])
    : [...definition.options]
}

/** The address parameters, built from the `filters` of src/config/toolConfig.ts (nothing is listed here). */
export const filterParams = Object.fromEntries(
  filters.map((definition) => [
    definition.id,
    definition.type === 'select'
      ? stringParam(definition.id, definition.default, filterCodes(definition))
      : listParam(definition.id, [...definition.default], filterCodes(definition)),
  ]),
) as unknown as ParamSet<FilterValues>

/** The filters of the tool, kept in the address. */
export function useFilters() {
  const [values, update] = useUrlState(filterParams)
  const setFilter = useCallback((id: string, value: string | string[]) => update({ [id]: value }), [update])
  return [values, setFilter] as const
}

/** A readable (translated) description of a filter's value, for summaries and the contact e-mail. */
export function describeFilter(definition: FilterDefinition, value: string | string[], t: TFunction): string {
  const codes = Array.isArray(value) ? value : [value]
  return codes.map((code) => t(`${definition.nameKey}.${code}`)).join(', ')
}
