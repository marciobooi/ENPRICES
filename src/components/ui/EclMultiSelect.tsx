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
  const observerRef = useRef<MutationObserver | null>(null);

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
              
              // Add click listener to handle icon rotation manually
              const iconButton = iconDiv.querySelector('button');
              if (iconButton) {
                iconButton.addEventListener('click', () => {
                  const icon = iconDiv.querySelector('.ecl-icon') as HTMLElement;
                  const isRotated = icon?.style.transform === 'rotate(180deg)';
                  if (icon) {
                    icon.style.transform = isRotated ? 'rotate(0deg)' : 'rotate(180deg)';
                  }
                });
              }
            }
          }, 50);

          // Add mutation observer to watch for ECL state changes
          observerRef.current = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.type === 'attributes' && 
                  (mutation.attributeName === 'aria-expanded' || 
                   mutation.attributeName === 'class')) {
                const target = mutation.target as HTMLElement;
                const isExpanded = target.getAttribute('aria-expanded') === 'true' || 
                                 target.classList.contains('ecl-select--expanded') ||
                                 target.classList.contains('ecl-select--open');
                
                const icon = selectElement.parentElement?.querySelector('.ecl-select__icon .ecl-icon') as HTMLElement;
                if (icon) {
                  icon.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
                }
              }
            });
          });

          // Observe the select element and its parent for changes
          if (selectElement && observerRef.current) {
            observerRef.current.observe(selectElement, { attributes: true });
            if (selectElement.parentElement) {
              observerRef.current.observe(selectElement.parentElement, { attributes: true, subtree: true });
            }
          }

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
          // Additional safety check - ensure the instance is still valid
          if (selectRef.current && selectRef.current.parentElement) {
            eclInstanceRef.current.destroy();
          }
        } catch (error) {
          console.warn('ECL Select cleanup failed:', error);
        }
        eclInstanceRef.current = null;
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
      
      // Clean up mutation observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      
      isInitializedRef.current = false;
      eclInstanceRef.current = null;
    };
  }, []); // Empty dependency array - initialize only once

  // Handle value updates separately
  useEffect(() => {
    if (selectRef.current && isInitializedRef.current) {
      const selectElement = selectRef.current;
      
      // Debounce the update to prevent rapid successive calls
      const timeoutId = setTimeout(() => {
        // Double-check that elements still exist
        if (!selectElement || !selectElement.parentElement || !selectElement.options) {
          return;
        }

        // Update native select options safely
        if (selectElement && selectElement.options) {
          Array.from(selectElement.options).forEach(option => {
            option.selected = values.includes(option.value);
          });
        }

        // Trigger ECL update if instance is available and valid
        if (eclInstanceRef.current && 
            typeof eclInstanceRef.current.update === 'function' &&
            selectElement && 
            selectElement.parentElement &&
            selectElement.options && 
            selectElement.options.length > 0) {
          try {
            // Double check the element is still connected to the DOM
            if (selectElement.isConnected) {
              eclInstanceRef.current.update();
            }
          } catch (error) {
            console.warn('ECL Select update failed:', error);
            // Reset the instance if it's corrupted
            eclInstanceRef.current = null;
            isInitializedRef.current = false;
          }
        }
      }, 50); // 50ms debounce

      return () => clearTimeout(timeoutId);
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
          <span className="ecl-form-label__required" role="note" aria-label={t('ui.form.required', 'required')}>
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
