import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PoliteLiveRegion } from './index';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  id: string;
  label: string;
  options: SelectOption[];
  values?: string[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
  maxSelections?: number;
  showSelectAll?: boolean;
  onChange: (values: string[]) => void;
  onBlur?: () => void;
  'aria-describedby'?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  id,
  label,
  options,
  values = [],
  placeholder,
  disabled = false,
  required = false,
  error,
  helpText,
  className = '',
  maxSelections,
  showSelectAll = false,
  onChange,
  onBlur,
  'aria-describedby': ariaDescribedBy
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const helpId = helpText ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [ariaDescribedBy, helpId, errorId].filter(Boolean).join(' ') || undefined;

  const availableOptions = options.filter(option => !option.disabled);
  const allSelected = availableOptions.length > 0 && availableOptions.every(option => values.includes(option.value));
  const someSelected = values.length > 0 && values.length < availableOptions.length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    const totalOptions = showSelectAll ? options.length + 1 : options.length;
    
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else if (focusedIndex >= 0) {
          if (showSelectAll && focusedIndex === 0) {
            handleSelectAll();
          } else {
            const optionIndex = showSelectAll ? focusedIndex - 1 : focusedIndex;
            const option = options[optionIndex];
            if (option && !option.disabled) {
              handleOptionToggle(option.value);
            }
          }
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        buttonRef.current?.focus();
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else {
          const nextIndex = Math.min(focusedIndex + 1, totalOptions - 1);
          setFocusedIndex(nextIndex);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          const prevIndex = Math.max(focusedIndex - 1, 0);
          setFocusedIndex(prevIndex);
        }
        break;
      case 'Home':
        if (isOpen) {
          event.preventDefault();
          setFocusedIndex(0);
        }
        break;
      case 'End':
        if (isOpen) {
          event.preventDefault();
          setFocusedIndex(totalOptions - 1);
        }
        break;
    }
  };

  const handleOptionToggle = (value: string) => {
    const isSelected = values.includes(value);
    let newValues: string[];
    const option = options.find(opt => opt.value === value);

    if (isSelected) {
      newValues = values.filter(v => v !== value);
      announceToScreenReader(`Deselected ${option?.label}. ${newValues.length} items selected`);
    } else {
      if (maxSelections && values.length >= maxSelections) {
        announceToScreenReader(`Maximum ${maxSelections} selections reached`);
        return; // Don't add if max selections reached
      }
      newValues = [...values, value];
      announceToScreenReader(`Selected ${option?.label}. ${newValues.length} items selected`);
    }

    onChange(newValues);
  };

  const handleSelectAll = () => {
    if (allSelected) {
      onChange([]);
      announceToScreenReader('All items deselected');
    } else {
      const allValues = availableOptions.map(option => option.value);
      onChange(allValues);
      announceToScreenReader(`All ${allValues.length} items selected`);
    }
  };

  const announceToScreenReader = (message: string) => {
    setAnnouncementMessage(message);
    // Clear announcement after a short delay to allow for new announcements
    setTimeout(() => setAnnouncementMessage(''), 100);
  };

  const handleRemoveTag = (valueToRemove: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const newValues = values.filter(v => v !== valueToRemove);
    const option = options.find(opt => opt.value === valueToRemove);
    onChange(newValues);
    announceToScreenReader(`Removed ${option?.label}. ${newValues.length} items selected`);
  };

  const getDisplayText = () => {
    if (values.length === 0) {
      return placeholder || t('ui.multiselect.placeholder', 'Select options');
    }
    if (values.length === 1) {
      const option = options.find(opt => opt.value === values[0]);
      return option?.label || values[0];
    }
    return t('ui.multiselect.selected_count', '{{count}} selected', { count: values.length });
  };

  return (
    <div className={`ecl-form-group ${className}`} ref={selectRef}>
      <label className="ecl-form-label" htmlFor={id}>
        {label}
        {required && <span className="ecl-form-label__required"> *</span>}
      </label>
      
      {helpText && (
        <div className="ecl-help-block" id={helpId}>
          {helpText}
        </div>
      )}

      <div className={`ecl-select ecl-select--multiple ${error ? 'ecl-select--invalid' : ''}`}>
        <button
          ref={buttonRef}
          id={id}
          type="button"
          className="ecl-select__toggle"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-describedby={describedBy}
          aria-label={`${label}${required ? ', required' : ''}. ${values.length} items selected. Press space to open options.`}
          aria-activedescendant={isOpen && focusedIndex >= 0 ? `${id}-option-${focusedIndex}` : undefined}
          disabled={disabled}
          onKeyDown={handleKeyDown}
          onClick={() => {
            if (!disabled) {
              setIsOpen(!isOpen);
              if (!isOpen) {
                setFocusedIndex(0);
                announceToScreenReader(`Options list opened. ${options.length} options available`);
              } else {
                announceToScreenReader('Options list closed');
              }
            }
          }}
          onBlur={onBlur}
        >
          <div className="ecl-select__toggle-content">
            <span className="ecl-select__toggle-text">
              {getDisplayText()}
            </span>
            
            {values.length > 0 && (
              <div className="ecl-select__tags">
                {values.slice(0, 3).map(value => {
                  const option = options.find(opt => opt.value === value);
                  return (
                    <span key={value} className="ecl-tag ecl-tag--removable">
                      <span className="ecl-tag__label">{option?.label || value}</span>
                      <button
                        type="button"
                        className="ecl-tag__remove"
                        aria-label={t('ui.multiselect.remove_item', 'Remove {{item}}', { item: option?.label || value })}
                        onClick={(e) => handleRemoveTag(value, e)}
                      >
                        <i className="fa fa-times" aria-hidden="true"></i>
                      </button>
                    </span>
                  );
                })}
                {values.length > 3 && (
                  <span className="ecl-tag">
                    +{values.length - 3} {t('ui.multiselect.more', 'more')}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <i 
            className={`fa ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'} ecl-select__icon`}
            aria-hidden="true"
          ></i>
        </button>

        {isOpen && (
          <ul
            ref={listRef}
            className="ecl-select__list"
            role="listbox"
            aria-multiselectable="true"
            aria-labelledby={id}
          >
            {showSelectAll && (
              <li
                id={`${id}-option-select-all`}
                className={`ecl-select__option ecl-select__option--select-all ${
                  focusedIndex === 0 ? 'ecl-select__option--focused' : ''
                }`}
                role="option"
                aria-selected={allSelected}
                onClick={handleSelectAll}
                onMouseEnter={() => setFocusedIndex(0)}
              >
                <label className="ecl-checkbox">
                  <input
                    type="checkbox"
                    className="ecl-checkbox__input"
                    checked={allSelected}
                    ref={allSelected || someSelected ? undefined : undefined}
                    onChange={handleSelectAll}
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                  <span className="ecl-checkbox__label">
                    <span className="ecl-checkbox__box">
                      <i className={`fa ${allSelected ? 'fa-check' : someSelected ? 'fa-minus' : ''} ecl-checkbox__icon`} aria-hidden="true"></i>
                    </span>
                    {t('ui.multiselect.select_all', 'Select all')}
                  </span>
                </label>
              </li>
            )}

            {options.map((option, index) => {
              const isSelected = values.includes(option.value);
              const actualIndex = showSelectAll ? index + 1 : index;
              const isMaxReached = Boolean(maxSelections && values.length >= maxSelections && !isSelected);
              
              return (
                <li
                  key={option.value}
                  id={`${id}-option-${actualIndex}`}
                  className={`ecl-select__option ${
                    isSelected ? 'ecl-select__option--selected' : ''
                  } ${
                    actualIndex === focusedIndex ? 'ecl-select__option--focused' : ''
                  } ${
                    option.disabled || isMaxReached ? 'ecl-select__option--disabled' : ''
                  }`}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled || isMaxReached}
                  onClick={() => {
                    if (!option.disabled && !isMaxReached) {
                      handleOptionToggle(option.value);
                    }
                  }}
                  onMouseEnter={() => setFocusedIndex(actualIndex)}
                >
                  <label className="ecl-checkbox">
                    <input
                      type="checkbox"
                      className="ecl-checkbox__input"
                      checked={isSelected}
                      disabled={option.disabled || isMaxReached}
                      onChange={() => handleOptionToggle(option.value)}
                      tabIndex={-1}
                      aria-hidden="true"
                    />
                    <span className="ecl-checkbox__label">
                      <span className="ecl-checkbox__box">
                        <i className={`fa ${isSelected ? 'fa-check' : ''} ecl-checkbox__icon`} aria-hidden="true"></i>
                      </span>
                      {option.label}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {maxSelections && (
        <div className="ecl-help-block">
          {t('ui.multiselect.max_selections', 'Maximum {{max}} selections', { max: maxSelections })}
        </div>
      )}

      {error && (
        <div className="ecl-feedback-message" id={errorId} role="alert">
          {error}
        </div>
      )}

      {/* Screen reader announcements */}
      <PoliteLiveRegion>
        {announcementMessage}
      </PoliteLiveRegion>
    </div>
  );
};

export default MultiSelect;
