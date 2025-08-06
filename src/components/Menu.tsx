import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PoliteLiveRegion, EclMultiSelect, EclSingleSelect, RoundBtn, useFocusTrap } from './ui/index';
import { useQuery } from '../context/QueryContext';
import { 
  AGGREGATES_COUNTRY_CODES, 
  EU_COUNTRY_CODES, 
  EFTA_COUNTRY_CODES, 
  ENLARGEMENT_COUNTRY_CODES, 
  getEnergyProductOptions,
  getEnergyConsumerOptions,
  getEnergyYearOptions,
  getConsumptionBandOptionsByContext,
  getUnitOptionsByContext,
  getDefaultConsumptionBandByContext,
  getDefaultUnitByContext,
  getDatasetByProductAndConsumer
} from "../data/energyData";

interface MenuProps {
  className?: string;
  selectedCountries?: string[];
  onCountriesChange?: (countries: string[]) => void;
  selectedProduct?: string;
  onProductChange?: (product: string) => void;
  selectedConsumer?: string;
  onConsumerChange?: (consumer: string) => void;
  selectedYear?: string;
  onYearChange?: (year: string) => void;
  selectedBand?: string;
  onBandChange?: (band: string) => void;
  selectedUnit?: string;
  onUnitChange?: (unit: string) => void;
}

const Menu: React.FC<MenuProps> = ({ 
  className = '',
  selectedCountries = ["EU27_2020"],
  onCountriesChange,
  selectedProduct = "6000",
  onProductChange,
  selectedConsumer = "HOUSEHOLD",
  onConsumerChange,
  selectedYear = new Date().getFullYear().toString(),
  onYearChange,
  selectedBand = getDefaultConsumptionBandByContext("6000", "HOUSEHOLD"),
  onBandChange,
  selectedUnit = getDefaultUnitByContext("6000", "HOUSEHOLD"),
  onUnitChange
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [countries, setCountries] = useState<string[]>(selectedCountries);
  const [product, setProduct] = useState<string>(selectedProduct);
  const [consumer, setConsumer] = useState<string>(selectedConsumer);
  const [year, setYear] = useState<string>(selectedYear);
  const [band, setBand] = useState<string>(selectedBand);
  const [unit, setUnit] = useState<string>(selectedUnit);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Sync countries and product state with props
  useEffect(() => {
    setCountries(selectedCountries);
  }, [selectedCountries]);

  useEffect(() => {
    setProduct(selectedProduct);
  }, [selectedProduct]);

  useEffect(() => {
    setConsumer(selectedConsumer);
  }, [selectedConsumer]);

  useEffect(() => {
    setYear(selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    setBand(selectedBand);
  }, [selectedBand]);

  useEffect(() => {
    setUnit(selectedUnit);
  }, [selectedUnit]);

  // Dynamic dataset selection: when product or consumer changes, update band and unit defaults
  useEffect(() => {
    const newDefaultBand = getDefaultConsumptionBandByContext(product, consumer);
    const newDefaultUnit = getDefaultUnitByContext(product, consumer);
    
    // Only update if the current values are no longer valid for this dataset
    const validBandOptions = getConsumptionBandOptionsByContext(product, consumer);
    const validUnitOptions = getUnitOptionsByContext(product, consumer);
    
    const isBandValid = validBandOptions.some(option => option.value === band);
    const isUnitValid = validUnitOptions.some(option => option.value === unit);
    
    if (!isBandValid) {
      setBand(newDefaultBand);
      onBandChange?.(newDefaultBand);
    }
    
    if (!isUnitValid) {
      setUnit(newDefaultUnit);
      onUnitChange?.(newDefaultUnit);
    }
  }, [product, consumer]); // Only trigger when product or consumer changes

  // Focus trap for the menu when open
  const focusTrapRef = useFocusTrap(isOpen, true, () => setIsOpen(false));

  const handleCountryChange = (selectedValues: string[]) => {
    setCountries(selectedValues);
    onCountriesChange?.(selectedValues);
  };

  const handleProductChange = (selectedValue: string) => {
    setProduct(selectedValue);
    onProductChange?.(selectedValue);
  };

  const handleConsumerChange = (selectedValue: string) => {
    setConsumer(selectedValue);
    onConsumerChange?.(selectedValue);
  };

  const handleYearChange = (selectedValue: string) => {
    setYear(selectedValue);
    onYearChange?.(selectedValue);
  };

  const handleBandChange = (selectedValue: string) => {
    setBand(selectedValue);
    onBandChange?.(selectedValue);
  };

  const handleUnitChange = (selectedValue: string) => {
    setUnit(selectedValue);
    onUnitChange?.(selectedValue);
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

  // Get energy year options - memoized
  const energyYearOptions = useMemo(() => {
    return getEnergyYearOptions().map(option => ({
      ...option,
      label: t(`energy.years.${option.value}`, option.label)
    })).reverse(); // Most recent years first
  }, [t]);

  // Get energy band options (based on current product and consumer) - memoized
  const energyBandOptions = useMemo(() => {
    return getConsumptionBandOptionsByContext(product, consumer).map((option: {value: string; label: string}) => ({
      ...option,
      label: t(`energy.bands.${option.value}`, option.label)
    }));
  }, [product, consumer, t]);

  // Get energy unit options (based on current product and consumer) - memoized
  const energyUnitOptions = useMemo(() => {
    return getUnitOptionsByContext(product, consumer).map((option: {value: string; label: string}) => ({
      ...option,
      label: t(`energy.units.${option.value}`, option.label)
    }));
  }, [product, consumer, t]);

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

  // Close menu on escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
        announceToScreenReader('Menu closed');
      }
    };

    const handleArrowNavigation = (event: KeyboardEvent) => {
      if (isOpen && menuRef.current) {
        const menuItems = menuRef.current.querySelectorAll('[role="menuitem"]') as NodeListOf<HTMLElement>;
        
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          const currentIndex = Array.from(menuItems).findIndex(item => item === document.activeElement);
          let nextIndex;
          
          if (event.key === 'ArrowDown') {
            nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
          } else {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
          }
          
          menuItems[nextIndex]?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    document.addEventListener('keydown', handleArrowNavigation);
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('keydown', handleArrowNavigation);
    };
  }, [isOpen]);

  return (
    <div className={`menu-container ${className}`}>
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

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={(el) => {
            menuRef.current = el;
            if (focusTrapRef.current !== el) {
              (focusTrapRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
            }
          }}
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
            </div>
          </div>
        </div>
      )}

      {/* Screen reader announcements */}
      <PoliteLiveRegion>
        {announcementMessage}
      </PoliteLiveRegion>
    </div>
  );
};

export default Menu;
