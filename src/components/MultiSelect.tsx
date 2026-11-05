import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { FieldLabel } from './FieldLabel'
import { flattenOptions, isSelectGroup, type SelectItem, type SelectOption } from './selectTypes'
import { ToolbarIcon } from './ToolbarIcon'

export interface MultiSelectLabels {
  placeholder: string
  selectAll: string
  clearAll: string
  close: string
  search: string
  noResults: string
  /** Screen-reader text read before the counter number, e.g. "Selected:". */
  selected: string
  /** Screen-reader text before the number of visible options, e.g. "Options available:". */
  optionsAvailable: string
}

interface MultiSelectProps {
  label: string
  /** Options, or groups of options (rendered as `<fieldset>` + `<legend>`). */
  options: SelectItem[]
  values: string[]
  onChange: (values: string[]) => void
  labels: MultiSelectLabels
  helper?: string
  /** Error text; also marks the field as invalid. */
  error?: string
  disabled?: boolean
  required?: boolean
  /** Translated "(required)" text (e.g. `t('form.required')`). */
  requiredText?: string
  hideLabel?: boolean
  /** Field name: when set, every selected value is submitted with a form (hidden inputs). */
  name?: string
  width?: 's' | 'm' | 'l'
  /** Show the search box. Default: true when there are more than 8 options. */
  searchable?: boolean
  /** Show the "select all" checkbox. Default: true. */
  selectAll?: boolean
  id?: string
}

function Checkbox({
  id,
  label,
  checked,
  disabled,
  onChange,
  extraClass = '',
}: {
  id: string
  label: string
  checked: boolean
  disabled?: boolean
  onChange: () => void
  extraClass?: string
}) {
  return (
    <div className={`ecl-checkbox ${disabled ? 'ecl-checkbox--disabled' : ''} ${extraClass}`.trim()}>
      <input
        id={id}
        type="checkbox"
        className="ecl-checkbox__input"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      <label className="ecl-checkbox__label" htmlFor={id}>
        <span className={`ecl-checkbox__box ${disabled ? 'ecl-checkbox__box--disabled' : ''}`.trim()} aria-hidden="true">
          <ToolbarIcon name="check" className="ecl-checkbox__icon" />
        </span>
        <span className="ecl-checkbox__label-text">{label}</span>
      </label>
    </div>
  )
}

/**
 * ECL multiple select built in React: the markup and classes of the ECL reference (label wrapper, help block,
 * counter, toggle, dropdown with search, select all, grouped checkboxes and toolbar) without the ECL DOM script.
 * Disclosure pattern: the button toggles a group of checkboxes; Escape or leaving the control closes it.
 */
export function MultiSelect({
  label,
  options,
  values,
  onChange,
  labels,
  helper,
  error,
  disabled = false,
  required = false,
  requiredText = '(required)',
  hideLabel = false,
  name,
  width = 'm',
  searchable,
  selectAll = true,
  id,
}: MultiSelectProps) {
  const generatedId = useId()
  const baseId = id ?? `multiselect-${generatedId}`
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const flat = useMemo(() => flattenOptions(options), [options])
  const showSearch = searchable ?? flat.length > 8
  const selected = useMemo(() => new Set(values), [values])

  // The options that match the search, keeping the group structure; ids stay stable per option position.
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    const matches = (option: SelectOption) => !keyword || option.label.toLowerCase().includes(keyword)
    return options
      .map((item) =>
        isSelectGroup(item) ? { ...item, options: item.options.filter(matches) } : matches(item) ? item : null,
      )
      .filter((item): item is SelectItem => item !== null && (!isSelectGroup(item) || item.options.length > 0))
  }, [options, query])
  const visible = useMemo(() => flattenOptions(filtered), [filtered])
  const selectable = visible.filter((option) => !option.disabled)
  const allChecked = selectable.length > 0 && selectable.every((option) => selected.has(option.value))
  // Ids use the option's position, not its value (values can contain characters that are not valid in an id).
  const positions = useMemo(() => new Map(flat.map((option, index) => [option.value, index])), [flat])
  const optionId = (option: SelectOption) => `${baseId}-opt-${positions.get(option.value)}`

  const close = (returnFocus: boolean) => {
    // Unmount the dropdown (and release the focus trap) first, then move focus to the toggle.
    flushSync(() => {
      setOpen(false)
      setQuery('')
    })
    if (returnFocus) toggleRef.current?.focus()
  }

  // Focus stays inside the open dropdown (search, select all, options, Close, Clear all): Tab and Shift+Tab
  // cycle, and Escape closes it and puts focus back on the toggle button.
  useFocusTrap(dropdownRef, {
    active: open,
    onDeactivate: () => close(true),
    initialFocus: 'input[type="search"], input[type="checkbox"]:not(:disabled)',
    returnFocus: false,
    closeOnOutsideClick: false,
  })

  // A click outside closes the control and leaves focus on whatever was clicked. flushSync makes the trap
  // release before the browser moves focus, so it does not pull focus back into the dropdown.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        flushSync(() => {
          setOpen(false)
          setQuery('')
        })
      }
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [open])

  const toggleValue = (value: string) =>
    onChange(selected.has(value) ? values.filter((current) => current !== value) : [...values, value])

  const toggleAll = () => {
    const visibleValues = selectable.map((option) => option.value)
    onChange(
      allChecked
        ? values.filter((value) => !visibleValues.includes(value))
        : [...values, ...visibleValues.filter((value) => !selected.has(value))],
    )
  }

  const selectedLabels = flat.filter((option) => selected.has(option.value)).map((option) => option.label)
  const describedBy = [`${baseId}-counter`, helper ? `${baseId}-helper` : '', error ? `${baseId}-error` : '']
    .filter(Boolean)
    .join(' ')
  const containerClasses = [
    'ecl-select__container',
    `ecl-select__container--${width}`,
    disabled ? 'ecl-select__container--disabled' : '',
    error ? 'ecl-select__container--invalid' : '',
  ].filter(Boolean).join(' ')

  const renderCheckbox = (option: SelectOption) => (
    <Checkbox
      key={option.value}
      id={optionId(option)}
      label={option.label}
      checked={selected.has(option.value)}
      disabled={option.disabled}
      onChange={() => toggleValue(option.value)}
    />
  )

  return (
    <div className="ecl-form-group">
      <FieldLabel
        id={`${baseId}-label`}
        htmlFor={`${baseId}-toggle`}
        label={label}
        required={required}
        requiredText={requiredText}
        hidden={hideLabel}
      />
      {helper && <div id={`${baseId}-helper`} className="ecl-help-block">{helper}</div>}
      {error && <div id={`${baseId}-error`} className="ecl-feedback-message">{error}</div>}
      <div
        ref={wrapperRef}
        className="ecl-select__multiple"
      >
        {name && values.map((value) => <input key={value} type="hidden" name={name} value={value} />)}
        <div className={containerClasses}>
          <div
            id={`${baseId}-counter`}
            className={`ecl-select-multiple-selections-counter${values.length > 0 ? ' ecl-select-multiple-selections-counter--visible' : ''}`}
          >
            <div className="ecl-select-multiple-selections-counter__label">{labels.selected}</div>
            <span>{values.length}</span>
          </div>
          <button
            ref={toggleRef}
            id={`${baseId}-toggle`}
            type="button"
            className={`ecl-select ecl-select__multiple-toggle${open ? ' ecl-select--active' : ''}`}
            aria-expanded={open}
            aria-controls={open ? `${baseId}-dropdown` : undefined}
            aria-describedby={describedBy}
            disabled={disabled}
            onClick={() => (open ? close(false) : setOpen(true))}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown' && !open) {
                event.preventDefault()
                setOpen(true)
              }
            }}
          >
            {selectedLabels.length > 0 ? selectedLabels.join(', ') : labels.placeholder}
          </button>
          <div className="ecl-select__icon" aria-hidden="true">
            <span className="select-caret"><ToolbarIcon name="caret-down" /></span>
          </div>
        </div>

        {open && (
          <div
            ref={dropdownRef}
            id={`${baseId}-dropdown`}
            className={`ecl-select__multiple-dropdown ecl-select__container ecl-select__container--${width}`}
            role="group"
            aria-labelledby={`${baseId}-label`}
          >
            {showSearch && (
              <input
                type="search"
                className="ecl-text-input"
                placeholder={labels.search}
                aria-label={labels.search}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            )}
            {selectAll && selectable.length > 0 && (
              <Checkbox
                id={`${baseId}-all`}
                label={`${labels.selectAll} (${selectable.length})`}
                checked={allChecked}
                onChange={toggleAll}
                extraClass="ecl-select__multiple-all"
              />
            )}
            <div className="ecl-select__multiple-options" aria-live="polite">
              <span className="ecl-select__multiple-options-nb">{`${labels.optionsAvailable} ${selectable.length}`}</span>
              {filtered.map((item) =>
                isSelectGroup(item) ? (
                  <fieldset key={item.label} className="ecl-select__multiple-group">
                    <legend className="ecl-select__multiple-group__title">{item.label}</legend>
                    {item.options.map(renderCheckbox)}
                  </fieldset>
                ) : (
                  renderCheckbox(item)
                ),
              )}
              {visible.length === 0 && (
                <div className="ecl-select__multiple-no-results"><span>{labels.noResults}</span></div>
              )}
            </div>
            <div className="ecl-select-multiple-toolbar">
              <button type="button" className="ecl-button ecl-button--primary" onClick={() => close(true)}>
                {labels.close}
              </button>
              <button type="button" className="ecl-button ecl-button--secondary" onClick={() => onChange([])}>
                {labels.clearAll}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
