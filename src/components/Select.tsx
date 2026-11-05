import { useId } from 'react'
import { FieldLabel } from './FieldLabel'
import { isSelectGroup, type SelectItem, type SelectOption } from './selectTypes'
import { ToolbarIcon } from './ToolbarIcon'

interface SelectProps {
  label: string
  /** Options, or groups of options (rendered as `<optgroup>`). */
  options: SelectItem[]
  value: string
  onChange: (value: string) => void
  /** Optional first, empty option (e.g. "Select a country"). */
  placeholder?: string
  helper?: string
  /** Error text; also marks the field as invalid. */
  error?: string
  disabled?: boolean
  required?: boolean
  /** Translated "(required)" text (e.g. `t('form.required')`). */
  requiredText?: string
  hideLabel?: boolean
  name?: string
  width?: 's' | 'm' | 'l'
  id?: string
}

function Option({ option }: { option: SelectOption }) {
  return <option value={option.value} disabled={option.disabled}>{option.label}</option>
}

/**
 * ECL single select: a native `<select>` (full keyboard and screen-reader support) in ECL form-group markup,
 * the same structure as the ECL reference (label wrapper, help block, container, icon).
 */
export function Select({
  label,
  options,
  value,
  onChange,
  placeholder,
  helper,
  error,
  disabled = false,
  required = false,
  requiredText = '(required)',
  hideLabel = false,
  name,
  width = 'm',
  id,
}: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? `select-${generatedId}`
  const helperId = `${selectId}-helper`
  const errorId = `${selectId}-error`
  const describedBy = [helper ? helperId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined

  const containerClasses = [
    'ecl-select__container',
    `ecl-select__container--${width}`,
    disabled ? 'ecl-select__container--disabled' : '',
    error ? 'ecl-select__container--invalid' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className="ecl-form-group">
      <FieldLabel
        id={`${selectId}-label`}
        htmlFor={selectId}
        label={label}
        required={required}
        requiredText={requiredText}
        hidden={hideLabel}
      />
      {helper && <div id={helperId} className="ecl-help-block">{helper}</div>}
      {error && <div id={errorId} className="ecl-feedback-message">{error}</div>}
      <div className={containerClasses}>
        <select
          id={selectId}
          name={name}
          className="ecl-select"
          value={value}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((item) =>
            isSelectGroup(item) ? (
              <optgroup key={item.label} label={item.label}>
                {item.options.map((option) => <Option key={option.value} option={option} />)}
              </optgroup>
            ) : (
              <Option key={item.value} option={item} />
            ),
          )}
        </select>
        <div className="ecl-select__icon" aria-hidden="true">
          <span className="select-caret"><ToolbarIcon name="caret-down" /></span>
        </div>
      </div>
    </div>
  )
}
