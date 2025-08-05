import React, { useState } from 'react';
import { SingleSelect, MultiSelect, type SelectOption } from './ui';

const SelectExample: React.FC = () => {
  const [singleValue, setSingleValue] = useState<string>('');
  const [multiValues, setMultiValues] = useState<string[]>([]);

  const countryOptions: SelectOption[] = [
    { value: 'BE', label: 'Belgium' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
    { value: 'IT', label: 'Italy' },
    { value: 'NL', label: 'Netherlands' },
    { value: 'ES', label: 'Spain' },
    { value: 'PL', label: 'Poland' },
    { value: 'PT', label: 'Portugal' },
  ];

  const categoryOptions: SelectOption[] = [
    { value: 'electricity', label: 'Electricity' },
    { value: 'gas', label: 'Natural Gas' },
    { value: 'heating', label: 'Heating Oil' },
    { value: 'coal', label: 'Coal' },
    { value: 'renewable', label: 'Renewable Energy' },
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h2>Select Components Example</h2>
      
      <div style={{ marginBottom: '32px' }}>
        <SingleSelect
          id="country-select"
          label="Select Country"
          options={countryOptions}
          value={singleValue}
          placeholder="Choose a country..."
          helpText="Select a European Union member country"
          onChange={setSingleValue}
        />
        
        {singleValue && (
          <p style={{ marginTop: '8px', color: '#666' }}>
            Selected: <strong>{countryOptions.find(opt => opt.value === singleValue)?.label}</strong>
          </p>
        )}
      </div>

      <div style={{ marginBottom: '32px' }}>
        <MultiSelect
          id="categories-select"
          label="Select Energy Categories"
          options={categoryOptions}
          values={multiValues}
          placeholder="Choose categories..."
          helpText="Select one or more energy categories for analysis"
          showSelectAll={true}
          maxSelections={3}
          onChange={setMultiValues}
        />
        
        {multiValues.length > 0 && (
          <div style={{ marginTop: '8px', color: '#666' }}>
            Selected categories: 
            <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
              {multiValues.map(value => {
                const option = categoryOptions.find(opt => opt.value === value);
                return (
                  <li key={value}>{option?.label || value}</li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h3>Error State Example</h3>
        <SingleSelect
          id="error-select"
          label="Required Field"
          options={countryOptions}
          value=""
          placeholder="This field is required"
          required={true}
          error="Please select a country"
          onChange={() => {}}
        />
      </div>

      <div>
        <h3>Disabled State Example</h3>
        <MultiSelect
          id="disabled-select"
          label="Disabled Multi-Select"
          options={categoryOptions}
          values={['electricity', 'gas']}
          disabled={true}
          onChange={() => {}}
        />
      </div>
    </div>
  );
};

export default SelectExample;
