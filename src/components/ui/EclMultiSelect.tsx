import React, { useEffect } from 'react';
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

  const helpId = helpText ? `${id}-helper` : undefined;
  const describedBy = [ariaDescribedBy, helpId].filter(Boolean).join(' ') || undefined;

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValues = Array.from(event.target.selectedOptions, option => option.value);
    onChange(selectedValues);
  };

  // Initialize ECL Select component
  useEffect(() => {
    const initializeECL = () => {
      if ((window as any).ECL && (window as any).ECL.autoInit) {
        (window as any).ECL.autoInit();
      }
    };

    // Initialize immediately if ECL is available
    initializeECL();

    // Also try to initialize after a short delay in case ECL loads asynchronously
    const timer = setTimeout(initializeECL, 100);

    return () => clearTimeout(timer);
  }, []);

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
      
      <div className="ecl-select__container ecl-select__container--m ecl-select__container--hidden">
        <select 
          className="ecl-select" 
          id={id} 
          name={id} 
          required={required}
          disabled={disabled}
          aria-describedby={describedBy} 
          data-ecl-auto-init="Select" 
          multiple 
          data-ecl-select-multiple
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
