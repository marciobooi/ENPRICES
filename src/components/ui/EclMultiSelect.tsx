import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export interface EclSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface EclSelectOptionGroup {
  label: string;
  options: EclSelectOption[];
}

export interface EclMultiSelectProps {
  id: string;
  label: string;
  options?: EclSelectOption[];
  optionGroups?: EclSelectOptionGroup[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  'aria-describedby'?: string;
}

/**
 * ECL (Europa Component Library) Multi-Select Component
 * Uses native ECL HTML structure with proper initialization
 */
const EclMultiSelect: React.FC<EclMultiSelectProps> = ({
  id,
  label,
  options = [],
  optionGroups = [],
  values,
  onChange,
  placeholder = "Choose options...",
  helpText,
  required = false,
  disabled = false,
  className = '',
  'aria-describedby': ariaDescribedBy
}) => {
  const { t } = useTranslation();
  const selectRef = useRef<HTMLSelectElement>(null);

  const helpId = helpText ? `${id}-helper` : undefined;
  const describedBy = [ariaDescribedBy, helpId].filter(Boolean).join(' ') || undefined;

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValues = Array.from(event.target.selectedOptions, option => option.value);
    onChange(selectedValues);
  };

  // Initialize ECL Select component
  useEffect(() => {
    const initializeECL = () => {
      // Wait for ECL to be available and select element to be rendered
      if (typeof window !== 'undefined' && (window as any).ECL && selectRef.current) {
        const selectElement = selectRef.current;
        try {
          // Remove any existing ECL initialization
          if (selectElement.hasAttribute('data-ecl-auto-initialized')) {
            selectElement.removeAttribute('data-ecl-auto-initialized');
          }
          
          // Force re-initialization using the ECL Select constructor
          if ((window as any).ECL.Select) {
            new (window as any).ECL.Select(selectElement);
          } else if ((window as any).ECL.autoInit) {
            (window as any).ECL.autoInit(selectElement);
          }
        } catch (error) {
          console.warn('ECL Select initialization failed:', error);
          // Fallback to global auto-init
          if ((window as any).ECL.autoInit) {
            (window as any).ECL.autoInit();
          }
        }
      }
    };

    // Initialize after component mount with multiple attempts
    const timer1 = setTimeout(initializeECL, 50);
    const timer2 = setTimeout(initializeECL, 200);
    const timer3 = setTimeout(initializeECL, 500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [optionGroups, options, values]);

  return (
    <div className={`ecl-form-group ${className}`} role="application">
      <label 
        htmlFor={id} 
        id={`${id}-label`} 
        className="ecl-form-label"
      >
        {label}
        {required && (
          <span className="ecl-form-label__required" role="note" aria-label="required">
            *
          </span>
        )}
      </label>
      
      {helpText && (
        <div className="ecl-help-block" id={helpId}>
          {helpText}
        </div>
      )}
      
      <div className="ecl-select__container ecl-select__container--m">
        <select 
          ref={selectRef}
          className="ecl-select" 
          id={id} 
          name={id} 
          required={required}
          disabled={disabled}
          aria-describedby={describedBy} 
          data-ecl-auto-init="Select" 
          multiple 
          data-ecl-select-multiple=""
          data-ecl-select-default={placeholder}
          data-ecl-select-clear-all={t('ui.multiselect.clear_all', 'Clear all')}
          data-ecl-select-close={t('ui.multiselect.apply', 'Apply')}
          data-ecl-select-all={t('ui.multiselect.select_all', 'Select all')}
          data-ecl-select-search={t('ui.multiselect.search_placeholder', 'Enter filter keyword')}
          data-ecl-select-no-results={t('ui.multiselect.no_results', 'No results found')}
          tabIndex={-1}
          value={values}
          onChange={handleChange}
        >
          {/* Render option groups if provided */}
          {optionGroups.map((group, groupIndex) => (
            <optgroup key={groupIndex} label={group.label}>
              {group.options.map(option => (
                <option 
                  key={option.value} 
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
            </optgroup>
          ))}
          
          {/* Render flat options if no groups */}
          {options.map(option => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default EclMultiSelect;
