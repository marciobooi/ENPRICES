import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FocusTrap } from 'focus-trap-react';
import { PoliteLiveRegion, EclMultiSelect, EclSingleSelect, EclRadio, RoundBtn } from './ui/index';
import { useQuery } from '../context/QueryContext';
import { useDynamicYears } from '../hooks/useDynamicYears';
import { 
  AGGREGATES_COUNTRY_CODES, 
  EU_COUNTRY_CODES, 
  EFTA_COUNTRY_CODES, 
  ENLARGEMENT_COUNTRY_CODES, 
  getEnergyProductOptions,
  getEnergyConsumerOptions,
  getConsumptionBandOptionsByContext,
  getUnitOptionsByContext,
  getDefaultConsumptionBandByContext,
  getDefaultUnitByContext
} from "../data/energyData";

interface MenuProps {
  className?: string;
}

const Menu: React.FC<MenuProps> = ({ 
  className = ''
}) => {
  const { t } = useTranslation();
  const { state, dispatch } = useQuery();
  const { availableYears } = useDynamicYears();
  
  const [isOpen, setIsOpen] = useState(false);
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Extract values from global state
  const {
    geos: countries,
    product,
    consumer,
    time: year,
    consoms: band,
    unit
  } = state;

  // Dynamic dataset selection: when product or consumer changes, update band and unit defaults
  useEffect(() => {
    const newDefaultBand = getDefaultConsumptionBandByContext(product, consumer, state.component);
    const newDefaultUnit = getDefaultUnitByContext(product, consumer, state.component);
    
    // Only update if the current values are no longer valid for this dataset
    const validBandOptions = getConsumptionBandOptionsByContext(product, consumer, state.component);
    const validUnitOptions = getUnitOptionsByContext(product, consumer, state.component);
    
    const isBandValid = validBandOptions.some(option => option.value === band);
    const isUnitValid = validUnitOptions.some(option => option.value === unit);
    
    if (!isBandValid) {
      dispatch({ type: 'SET_BAND', payload: newDefaultBand });
    }
    
    if (!isUnitValid) {
      dispatch({ type: 'SET_UNIT', payload: newDefaultUnit });
    }
  }, [product, consumer, dispatch]); // Only trigger when product or consumer changes

  // Global state handlers
  const handleCountryChange = (selectedValues: string[]) => {
    dispatch({ type: 'SET_COUNTRIES', payload: selectedValues });
  };

  const handleProductChange = (selectedValue: string) => {
    dispatch({ type: 'SET_PRODUCT', payload: selectedValue });
  };

  const handleConsumerChange = (selectedValue: string) => {
    dispatch({ type: 'SET_CONSUMER', payload: selectedValue });
  };

  const handleYearChange = (selectedValue: string) => {
    dispatch({ type: 'SET_YEAR', payload: selectedValue });
  };

  const handleBandChange = (selectedValue: string) => {
    dispatch({ type: 'SET_BAND', payload: selectedValue });
  };

  const handleUnitChange = (selectedValue: string) => {
    dispatch({ type: 'SET_UNIT', payload: selectedValue });
  };

  const handleComponentChange = (value: string) => {
    dispatch({ type: 'SET_COMPONENT', payload: value === 'true' });
  };

  const handleDetailsChange = (value: string) => {
    dispatch({ type: 'SET_DETAILS', payload: value === 'true' });
  };

  // Get energy product options - memoized
  const energyProductOptions = useMemo(() => {
    return getEnergyProductOptions().map(option => ({
      ...option,
      label: t(`energy.products.${option.value}`, option.label)
    }));
  }, [t]);

  // Get energy consumer options - memoized
  const energyConsumerOptions = useMemo(() => {
    return getEnergyConsumerOptions().map(option => ({
      ...option,
      label: t(`energy.consumers.${option.value}`, option.label)
    }));
  }, [t]);

  // Get energy year options - memoized from dynamic API data
  const energyYearOptions = useMemo(() => {
    return availableYears.map(year => ({
      value: year,
      label: t(`energy.years.${year}`, year)
    }));
  }, [availableYears, t]);

  // Get energy band options (based on current product and consumer) - memoized
  const energyBandOptions = useMemo(() => {
    return getConsumptionBandOptionsByContext(product, consumer, state.component).map((option: {value: string; label: string}) => ({
      ...option,
      label: t(`energy.bands.${option.value}`, option.label)
    }));
  }, [product, consumer, state.component, t]);

  // Get energy unit options (based on current product and consumer) - memoized
  const energyUnitOptions = useMemo(() => {
    return getUnitOptionsByContext(product, consumer, state.component).map((option: {value: string; label: string}) => ({
      ...option,
      label: t(`energy.units.${option.value}`, option.label)
    }));
  }, [product, consumer, state.component, t]);

  // Create country option groups - memoized
  const countryOptionGroups = useMemo(() => [
    {
      label: t("countries.groups.aggregates", "EU Aggregates"),
      options: AGGREGATES_COUNTRY_CODES.map(code => ({
        value: code,
        label: t(`countries.${code}`, code)
      }))
    },
    {
      label: t("countries.groups.eu", "EU Member States"),
      options: EU_COUNTRY_CODES.map(code => ({
        value: code,
        label: t(`countries.${code}`, code)
      }))
    },
    {
      label: t("countries.groups.efta", "EFTA Countries"),
      options: EFTA_COUNTRY_CODES.map(code => ({
        value: code,
        label: t(`countries.${code}`, code)
      }))
    },
    {
      label: t("countries.groups.enlargement", "Enlargement Countries"),
      options: ENLARGEMENT_COUNTRY_CODES.map(code => ({
        value: code,
        label: t(`countries.${code}`, code)
      }))
    }
  ], [t]);

  const toggleMenu = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    // Announce state change to screen readers
    const announcement = newIsOpen ? 'Menu opened' : 'Menu closed';
    announceToScreenReader(announcement);
  };

  const announceToScreenReader = (message: string) => {
    setAnnouncementMessage(message);
    // Clear announcement after a short delay to allow for new announcements
    setTimeout(() => setAnnouncementMessage(''), 100);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`menu-container ${className}`}>
      {/* Dropdown Menu with Focus Trap */}
      {isOpen && (
        <FocusTrap
          active={isOpen}
          focusTrapOptions={{
            initialFocus: '#menu-toggle-button',
            allowOutsideClick: true,
            clickOutsideDeactivates: true,
            setReturnFocus: (nodeFocusedBeforeActivation: HTMLElement | SVGElement) => buttonRef.current || nodeFocusedBeforeActivation,
            escapeDeactivates: true,
            onDeactivate: () => {
              setIsOpen(false);
              announceToScreenReader('Menu closed');
            }
          }}
        >
          {/* Hamburger Menu Button */}
          <RoundBtn
            ref={buttonRef}
            id="menu-toggle-button"
            className={isOpen ? 'active' : ''}
            onClick={toggleMenu}
            ariaExpanded={isOpen}
            ariaControls="dropdown-menu"
            ariaLabel={t('menu.toggle', 'Toggle menu') + (isOpen ? ', menu is open' : ', menu is closed')}
            variant="ghost"
            size="medium"
            icon={isOpen ? 'fa-times' : 'fa-bars'}
            iconOnly={true}
          />
          <div
            ref={menuRef}
            id="dropdown-menu"
            className="menu-dropdown"
            role="menu"
            aria-labelledby="menu-toggle-button"
            aria-orientation="horizontal"
          >
          <div className="menu-content">
            {/* ECL Grid Container */}
            <div className="ecl-container">
              <div className="ecl-row ecl-u-mt-m">
                {/* First Row: Countries, Fuel (Product), Consumer */}
                <div className="ecl-col-4">
                  {/* Countries Selection Section */}
                  <div className="menu-section">
                    <div className="menu-countries">
                      <EclMultiSelect
                        id="menu-select-countries"
                        label={t("nav.countries.label", "Select Countries")}
                        optionGroups={countryOptionGroups}
                        values={countries}
                        onChange={handleCountryChange}
                        placeholder={t("nav.countries.placeholder", "Choose countries...")}
                        helpText={t("nav.countries.help", "Select up to 10 countries to compare")}
                        required={true}
                      />
                    </div>
                  </div>
                </div>

                <div className="ecl-col-4">
                  {/* Energy Product (Fuel) Selection Section */}
                  <div className="menu-section">
                    <div className="menu-product">
                      <EclSingleSelect
                        id="menu-select-product"
                        label={t("energy.products.label", "Select Energy Product")}
                        options={energyProductOptions}
                        value={product}
                        onChange={handleProductChange}
                        placeholder={t("energy.products.placeholder", "Choose an energy product...")}
                        helpText={t("energy.products.help", "Select the energy product you want to analyze")}
                        required={true}
                      />
                    </div>
                  </div>
                </div>

                <div className="ecl-col-4">
                  {/* Energy Consumer Selection Section */}
                  <div className="menu-section">
                    <div className="menu-consumer">
                      <EclSingleSelect
                        id="menu-select-consumer"
                        label={t("energy.consumers.label", "Select Consumer Type")}
                        options={energyConsumerOptions}
                        value={consumer}
                        onChange={handleConsumerChange}
                        placeholder={t("energy.consumers.placeholder", "Choose a consumer type...")}
                        helpText={t("energy.consumers.help", "Select household or non-household consumers")}
                        required={true}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="ecl-row ecl-u-mt-m">
                {/* Second Row: Year, Consumption Band, Unit */}
                <div className="ecl-col-4">
                  {/* Energy Year Selection Section */}
                  <div className="menu-section">
                    <div className="menu-year">
                      <EclSingleSelect
                        id="menu-select-year"
                        label={t("energy.years.label", "Select Year")}
                        options={energyYearOptions}
                        value={year}
                        onChange={handleYearChange}
                        placeholder={t("energy.years.placeholder", "Choose a year...")}
                        helpText={t("energy.years.help", "Select the year for energy price data")}
                        required={true}
                      />
                    </div>
                  </div>
                </div>

                <div className="ecl-col-4">
                  {/* Energy Band (Consumption) Selection Section */}
                  <div className="menu-section">
 <div className="menu-band">
                      <EclSingleSelect
                        id="menu-select-band"
                        label={t("energy.bands.label", "Select Consumption Band")}
                        options={energyBandOptions}
                        value={band}
                        onChange={handleBandChange}
                        placeholder={t("energy.bands.placeholder", "Choose a consumption band...")}
                        helpText={t("energy.bands.help", "Select the energy consumption band for analysis")}
                        required={true}
                      />
                    </div>
                  </div>
                </div>

                <div className="ecl-col-4">
                  {/* Energy Unit Selection Section */}
                  <div className="menu-section">
                    <div className="menu-unit">
                      <EclSingleSelect
                        id="menu-select-unit"
                        label={t("energy.units.label", "Select Unit")}
                        options={energyUnitOptions}
                        value={unit}
                        onChange={handleUnitChange}
                        placeholder={t("energy.units.placeholder", "Choose a unit...")}
                        helpText={t("energy.units.help", "Select the unit for energy price display")}
                        required={true}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="ecl-row ecl-u-mt-m">
                {/* Third Row: Components and Details Radio Buttons */}
                <div className="ecl-col-6">
                  {/* Components Selection Section */}
                  <div className="menu-section">
                    <div className="menu-component">
                      <EclRadio
                        id="menu-radio-component"
                        name="component-group"
                        label={t("energy.component.label", "Include Components")}
                        helpText={t("energy.component.help", "Choose whether to include detailed price components in the dataset")}
                        options={[
                          {
                            value: "false",
                            label: t("energy.component.no", "No - Total prices only"),
                            checked: !state.component
                          },
                          {
                            value: "true", 
                            label: t("energy.component.yes", "Yes - Include components"),
                            checked: state.component
                          }
                        ]}
                        value={state.component.toString()}
                        onChange={handleComponentChange}
                        required={true}
                      />
                    </div>
                  </div>
                </div>

                <div className="ecl-col-6">
                  {/* Details Selection Section */}
                  <div className="menu-section">
                    <div className="menu-details">
                      <EclRadio
                        id="menu-radio-details"
                        name="details-group"
                        label={t("energy.details.label", "Show Details")}
                        helpText={t("energy.details.help", "Choose whether to display detailed information in charts")}
                        options={[
                          {
                            value: "false",
                            label: t("energy.details.no", "No - Summary view"),
                            checked: !state.details
                          },
                          {
                            value: "true",
                            label: t("energy.details.yes", "Yes - Detailed view"),
                            checked: state.details
                          }
                        ]}
                        value={state.details.toString()}
                        onChange={handleDetailsChange}
                        required={true}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </FocusTrap>
      )}

      {/* Hamburger Menu Button when closed */}
      {!isOpen && (
        <RoundBtn
          ref={buttonRef}
          id="menu-toggle-button"
          className={isOpen ? 'active' : ''}
          onClick={toggleMenu}
          ariaExpanded={isOpen}
          ariaControls="dropdown-menu"
          ariaLabel={t('menu.toggle', 'Toggle menu') + (isOpen ? ', menu is open' : ', menu is closed')}
          variant="ghost"
          size="medium"
          icon={isOpen ? 'fa-times' : 'fa-bars'}
          iconOnly={true}
        />
      )}

      {/* Screen reader announcements */}
      <PoliteLiveRegion>
        {announcementMessage}
      </PoliteLiveRegion>
    </div>
  );
};

export default Menu;
