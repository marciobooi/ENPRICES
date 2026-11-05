import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { consumptionBands, energyDatasets, filters, filtersUnderChart, type FilterDefinition } from '../config/toolConfig'
import type { FilterValues } from '../state/filters'
import { MultiSelect } from './MultiSelect'
import { Select } from './Select'
import type { SelectItem } from './selectTypes'

interface FilterControlsProps {
  values: FilterValues
  /** The periods the loaded dataset really has (oldest first). The period list follows the dataset, not the calendar. */
  periods?: readonly string[]
  onChange: (id: string, value: string | string[]) => void
}

/** One control per filter of src/config/toolConfig.ts; labels and option names come from the locale files. */
export function FilterControls({ values, periods, onChange }: FilterControlsProps) {
  const { t } = useTranslation()
  const product = typeof values.product === 'string' ? values.product : '6000'
  const consumer = typeof values.consumer === 'string' ? values.consumer : 'HOUSEHOLD'
  const dataset = energyDatasets[`${product}_${consumer}` as keyof typeof energyDatasets]
  const components = values.component === 'components'
  const activeDatasetCode = components ? dataset.componentsCode : dataset.code
  const availableUnits = components ? dataset.componentsUnits : dataset.units

  const multiSelectLabels = useMemo(
    () => ({
      placeholder: t('multiSelect.placeholder'),
      allSelected: t('multiSelect.allSelected'),
      selectAll: t('multiSelect.selectAll'),
      clearAll: t('multiSelect.clearAll'),
      close: t('multiSelect.close'),
      search: t('multiSelect.search'),
      noResults: t('multiSelect.noResults'),
      selected: t('multiSelect.selected'),
      optionsAvailable: t('multiSelect.optionsAvailable'),
    }),
    [t],
  )

  const optionsOf = useMemo(
    () => (definition: FilterDefinition): SelectItem[] => {
      const name = (code: string) => ({
        value: code,
        label: t(`${definition.nameKey}.${code}`, { defaultValue: code }),
      })
      if (definition.type === 'select') {
        const options = definition.id === 'band'
          ? (consumptionBands[activeDatasetCode] ?? [])
          : definition.id === 'unit'
            ? availableUnits
            : definition.id === 'time' && periods && periods.length > 0
              ? [...periods].reverse()
            : definition.id === 'time'
              ? Array.from({ length: new Date().getFullYear() - (components ? 2016 : 1984) }, (_, index) =>
                  String((components ? 2017 : 1985) + index),
                ).flatMap((year) => components ? [year] : [`${year}-S1`, `${year}-S2`])
            : definition.options
        return options.map(name)
      }
      return definition.options.map((option) =>
        typeof option === 'string'
          ? name(option)
          : { label: t(`${definition.groupKey}.${option.id}`, { defaultValue: option.id }), options: option.codes.map(name) },
      )
    },
    [activeDatasetCode, availableUnits, components, periods, t],
  )

  return (
    <>
      {filters.filter((definition) => !filtersUnderChart.includes(definition.id)).map((definition) =>
        definition.type === 'select' ? (
          <Select
            key={definition.id}
            label={t(`filters.${definition.id}`)}
            options={optionsOf(definition)}
            value={(() => {
              const selectedValue = typeof values[definition.id] === 'string' ? values[definition.id] as string : ''
              const options = optionsOf(definition)
              return options.some((option) => 'value' in option && option.value === selectedValue)
                ? selectedValue
                : definition.id === 'band'
                ? (components ? dataset.defaultComponentsBand : dataset.defaultBand)
                : definition.id === 'unit'
                  ? availableUnits.includes(selectedValue as never)
                    ? selectedValue
                    : availableUnits.includes('KWH' as never) ? 'KWH' : availableUnits[0]
                  : definition.id === 'time'
                    ? periods && periods.length > 0 ? periods[periods.length - 1] : components ? String(new Date().getFullYear() - 1) : `${new Date().getFullYear()}-S1`
                    : selectedValue
            })()}
            onChange={(value) => {
              onChange(definition.id, value)
              if (definition.id === 'product' || definition.id === 'consumer') {
                const nextProduct = definition.id === 'product' ? value : product
                const nextConsumer = definition.id === 'consumer' ? value : consumer
                const nextDataset = energyDatasets[`${nextProduct}_${nextConsumer}` as keyof typeof energyDatasets]
                const nextComponents = values.component === 'components'
                const code = nextComponents ? nextDataset.componentsCode : nextDataset.code
                const nextUnits = nextComponents ? nextDataset.componentsUnits : nextDataset.units
                if (!consumptionBands[code].includes(String(values.band))) {
                  onChange('band', nextComponents ? nextDataset.defaultComponentsBand : nextDataset.defaultBand)
                }
                if (!nextUnits.includes(String(values.unit) as never)) {
                  onChange('unit', nextUnits.includes('KWH' as never) ? 'KWH' : nextUnits[0])
                }
              }
            }}
          />
        ) : (
          <MultiSelect
            key={definition.id}
            label={t(`filters.${definition.id}`)}
            options={optionsOf(definition)}
            values={values[definition.id] as string[]}
            onChange={(next) => onChange(definition.id, next)}
            labels={multiSelectLabels}
            name={definition.id}
          />
        ),
      )}
    </>
  )
}
