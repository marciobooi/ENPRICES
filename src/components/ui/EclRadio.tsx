import React, { useEffect, useRef } from 'react';

// Extend window type for ECL
declare global {
  interface Window {
    ECL?: {
      Radio?: new (element: Element) => void;
    };
  }
}

interface RadioOption {
  value: string;
  label: string;
  checked?: boolean;
}

interface EclRadioProps {
  id: string;
  name: string;
  label: string;
  helpText?: string;
  options: RadioOption[];
  value?: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  labelHidden?: boolean;
}

export const EclRadio: React.FC<EclRadioProps> = ({
  id,
  name,
  label,
  helpText,
  options,
  value,
  onChange,
  required = false,
  className = '',
  labelHidden = false
}) => {
  const fieldsetRef = useRef<HTMLFieldSetElement>(null);
  const helperId = helpText ? `${id}-helper` : undefined;
  const labelId = `${id}-label`;

  useEffect(() => {
    // Initialize ECL radio functionality if available
    if (window.ECL && fieldsetRef.current) {
      try {
        const eclRadios = fieldsetRef.current.querySelectorAll('.ecl-radio');
        eclRadios.forEach((radio) => {
          if (window.ECL?.Radio) {
            new window.ECL.Radio(radio);
          }
        });
      } catch (error) {
        console.warn('ECL Radio initialization failed:', error);
      }
    }
  }, []);

  const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <fieldset
      ref={fieldsetRef}
      className={`ecl-form-group ${className}`}
      aria-describedby={helperId}
      role="radiogroup"
    >
      <legend
        id={labelId}
        className={`ecl-form-label ${labelHidden ? 'ecl-form-label--hidden' : ''}`}
      >
        {label}
        {!required && <span className="ecl-form-label__optional">(optional)</span>}
      </legend>
      
      {helpText && (
        <div className="ecl-help-block" id={helperId}>
          {helpText}
        </div>
      )}

      {options.map((option, index) => (
        <div key={option.value} className="ecl-radio ecl-radio--binary">
          <input
            id={`${id}-${index}`}
            name={name}
            className="ecl-radio__input"
            type="radio"
            value={option.value}
            checked={value === option.value || (value === undefined && option.checked)}
            onChange={handleRadioChange}
            required={required}
          />
          <label className="ecl-radio__label" htmlFor={`${id}-${index}`}>
            <span className="ecl-radio__box">
              <span className="ecl-radio__box-inner"></span>
            </span>
            <span className="ecl-radio__text">{option.label}</span>
          </label>
        </div>
      ))}
    </fieldset>
  );
};
