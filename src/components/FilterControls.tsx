import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { filters, type FilterDefinition } from '../config/toolConfig'
import type { FilterValues } from '../state/filters'
import { MultiSelect } from './MultiSelect'
import { Select } from './Select'
import type { SelectItem } from './selectTypes'

interface FilterControlsProps {
  values: FilterValues
  onChange: (id: string, value: string | string[]) => void
}

/** One control per filter of src/config/toolConfig.ts; labels and option names come from the locale files. */
export function FilterControls({ values, onChange }: FilterControlsProps) {
  const { t } = useTranslation()

  const multiSelectLabels = useMemo(
    () => ({
      placeholder: t('multiSelect.placeholder'),
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
      const name = (code: string) => ({ value: code, label: t(`${definition.nameKey}.${code}`) })
      if (definition.type === 'select') return definition.options.map(name)
      return definition.options.map((option) =>
        typeof option === 'string'
          ? name(option)
          : { label: t(`${definition.groupKey}.${option.id}`), options: option.codes.map(name) },
      )
    },
    [t],
  )

  return (
    <>
      {filters.map((definition) =>
        definition.type === 'select' ? (
          <Select
            key={definition.id}
            label={t(`filters.${definition.id}`)}
            options={optionsOf(definition)}
            value={values[definition.id] as string}
            onChange={(value) => onChange(definition.id, value)}
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
