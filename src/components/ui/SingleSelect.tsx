import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PoliteLiveRegion } from './index';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SingleSelectProps {
  id: string;
  label: string;
  options: SelectOption[];
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  'aria-describedby'?: string;
}

const SingleSelect: React.FC<SingleSelectProps> = ({
  id,
  label,
  options,
  value = '',
  placeholder,
  disabled = false,
  required = false,
  error,
  helpText,
  className = '',
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

  const selectedOption = options.find(option => option.value === value);
  const helpId = helpText ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [ariaDescribedBy, helpId, errorId].filter(Boolean).join(' ') || undefined;

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
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(value ? options.findIndex(opt => opt.value === value) : 0);
        } else if (focusedIndex >= 0) {
          const option = options[focusedIndex];
          if (option && !option.disabled) {
            onChange(option.value);
            setIsOpen(false);
            setFocusedIndex(-1);
            buttonRef.current?.focus();
            // Announce selection to screen readers
            const announcement = `Selected ${option.label}`;
            announceToScreenReader(announcement);
          }
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        buttonRef.current?.focus();
        announceToScreenReader('Selection cancelled');
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(value ? options.findIndex(opt => opt.value === value) : 0);
          announceToScreenReader('Options list opened');
        } else {
          const nextIndex = Math.min(focusedIndex + 1, options.length - 1);
          setFocusedIndex(nextIndex);
          // Announce focused option
          if (options[nextIndex]) {
            announceToScreenReader(`${options[nextIndex].label}, ${nextIndex + 1} of ${options.length}`);
          }
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          const prevIndex = Math.max(focusedIndex - 1, 0);
          setFocusedIndex(prevIndex);
          // Announce focused option
          if (options[prevIndex]) {
            announceToScreenReader(`${options[prevIndex].label}, ${prevIndex + 1} of ${options.length}`);
          }
        }
        break;
      case 'Home':
        if (isOpen) {
          event.preventDefault();
          setFocusedIndex(0);
          announceToScreenReader(`${options[0]?.label}, first option`);
        }
        break;
      case 'End':
        if (isOpen) {
          event.preventDefault();
          setFocusedIndex(options.length - 1);
          announceToScreenReader(`${options[options.length - 1]?.label}, last option`);
        }
        break;
      case 'Tab':
        if (isOpen) {
          setIsOpen(false);
          setFocusedIndex(-1);
        }
        break;
    }
  };

  const handleOptionClick = (option: SelectOption) => {
    if (!option.disabled) {
      onChange(option.value);
      setIsOpen(false);
      setFocusedIndex(-1);
      buttonRef.current?.focus();
      // Announce selection to screen readers
      announceToScreenReader(`Selected ${option.label}`);
    }
  };

  const announceToScreenReader = (message: string) => {
    setAnnouncementMessage(message);
    // Clear announcement after a short delay to allow for new announcements
    setTimeout(() => setAnnouncementMessage(''), 100);
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

      <div className={`ecl-select ${error ? 'ecl-select--invalid' : ''}`}>
        <button
          ref={buttonRef}
          id={id}
          type="button"
          className="ecl-select__toggle"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-describedby={describedBy}
          aria-label={`${label}${required ? ', required' : ''}${selectedOption ? `, currently selected: ${selectedOption.label}` : ''}`}
          aria-activedescendant={isOpen && focusedIndex >= 0 ? `${id}-option-${focusedIndex}` : undefined}
          disabled={disabled}
          onKeyDown={handleKeyDown}
          onClick={() => {
            if (!disabled) {
              setIsOpen(!isOpen);
              if (!isOpen) {
                setFocusedIndex(value ? options.findIndex(opt => opt.value === value) : 0);
                announceToScreenReader('Options list opened');
              } else {
                announceToScreenReader('Options list closed');
              }
            }
          }}
          onBlur={onBlur}
        >
          <span className="ecl-select__toggle-text">
            {selectedOption ? selectedOption.label : placeholder || t('ui.select.placeholder', 'Select an option')}
          </span>
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
            aria-labelledby={id}
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                id={`${id}-option-${index}`}
                className={`ecl-select__option ${
                  option.value === value ? 'ecl-select__option--selected' : ''
                } ${
                  index === focusedIndex ? 'ecl-select__option--focused' : ''
                } ${
                  option.disabled ? 'ecl-select__option--disabled' : ''
                }`}
                role="option"
                aria-selected={option.value === value}
                aria-disabled={option.disabled}
                onClick={() => handleOptionClick(option)}
                onMouseEnter={() => setFocusedIndex(index)}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>

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

export default SingleSelect;
