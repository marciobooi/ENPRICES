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
  const eclInstanceRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  const helpId = helpText ? `${id}-helper` : undefined;
  const describedBy = [ariaDescribedBy, helpId].filter(Boolean).join(' ') || undefined;

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValues = Array.from(event.target.selectedOptions, option => option.value);
    onChange(selectedValues);
  };

  // Initialize ECL Select component
  useEffect(() => {
    const initializeECL = () => {
      // Prevent duplicate initialization
      if (isInitializedRef.current || !selectRef.current) {
        return;
      }

      const selectElement = selectRef.current;
      
      // Check if ECL is available
      if (typeof window !== 'undefined' && (window as any).ECL) {
        try {
          // Clean up any existing ECL elements first
          const existingMultiple = selectElement.parentElement?.querySelector('.ecl-select__multiple');
          if (existingMultiple) {
            existingMultiple.remove();
          }

          // Remove any ECL-generated elements
          const eclIcon = selectElement.parentElement?.querySelector('.ecl-select__icon');
          if (eclIcon) {
            eclIcon.remove();
          }

          // Reset ECL attributes
          selectElement.removeAttribute('data-ecl-auto-initialized');
          selectElement.removeAttribute('data-ecl-select-initialized');
          
          // Initialize ECL Select
          if ((window as any).ECL.Select) {
            eclInstanceRef.current = new (window as any).ECL.Select(selectElement);
            isInitializedRef.current = true;
          } else if ((window as any).ECL.autoInit) {
            (window as any).ECL.autoInit(selectElement);
            isInitializedRef.current = true;
          }

          // If ECL didn't create the icon, add it manually
          setTimeout(() => {
            const iconContainer = selectElement.parentElement?.querySelector('.ecl-select__icon');
            if (!iconContainer) {
              const iconDiv = document.createElement('div');
              iconDiv.className = 'ecl-select__icon';
              iconDiv.innerHTML = `
                <button class="ecl-button ecl-button--ghost ecl-button--icon-only" type="button" tabindex="-1">
                  <span class="ecl-button__container">
                    <span class="ecl-button__label" data-ecl-label="true">${t('ui.select.toggle_dropdown', 'Toggle dropdown')}</span>
                    <svg class="ecl-icon ecl-icon--xs ecl-button__icon" focusable="false" aria-hidden="true" data-ecl-icon="">
                      <use xlink:href="/icons.svg#corner-arrow"></use>
                    </svg>
                  </span>
                </button>
              `;
              selectElement.parentElement?.appendChild(iconDiv);
            }
          }, 50);

        } catch (error) {
          console.warn('ECL Select initialization failed:', error);
          isInitializedRef.current = false;
        }
      }
    };

    // Single initialization attempt after a short delay
    const timer = setTimeout(initializeECL, 100);

    return () => {
      clearTimeout(timer);
      
      // Cleanup on unmount
      if (eclInstanceRef.current && typeof eclInstanceRef.current.destroy === 'function') {
        try {
          eclInstanceRef.current.destroy();
        } catch (error) {
          console.warn('ECL Select cleanup failed:', error);
        }
      }
      
      // Clean up ECL-generated elements
      if (selectRef.current && selectRef.current.parentElement) {
        const existingMultiple = selectRef.current.parentElement.querySelector('.ecl-select__multiple');
        if (existingMultiple) {
          existingMultiple.remove();
        }
        
        const eclIcon = selectRef.current.parentElement.querySelector('.ecl-select__icon');
        if (eclIcon) {
          eclIcon.remove();
        }
      }
      
      isInitializedRef.current = false;
      eclInstanceRef.current = null;
    };
  }, []); // Empty dependency array - initialize only once

  // Handle value updates separately
  useEffect(() => {
    if (selectRef.current && isInitializedRef.current) {
      // Update the select element values
      const selectElement = selectRef.current;
      Array.from(selectElement.options).forEach(option => {
        option.selected = values.includes(option.value);
      });

      // Trigger ECL update if instance is available
      if (eclInstanceRef.current && typeof eclInstanceRef.current.update === 'function') {
        try {
          eclInstanceRef.current.update();
        } catch (error) {
          console.warn('ECL Select update failed:', error);
        }
      }
    }
  }, [values]);

  return (
    <div className={`ecl-form-group ${className}`} role="application" key={`ecl-multiselect-${id}`}>
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
