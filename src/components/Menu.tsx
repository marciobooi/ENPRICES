import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PoliteLiveRegion, EclMultiSelect, EclSingleSelect, useFocusTrap } from './ui/index';
import { AGGREGATES_COUNTRY_CODES, EU_COUNTRY_CODES, EFTA_COUNTRY_CODES, ENLARGEMENT_COUNTRY_CODES, getEnergyProductOptions } from "../data/energyData";

interface MenuProps {
  className?: string;
  selectedCountries?: string[];
  onCountriesChange?: (countries: string[]) => void;
  selectedProduct?: string;
  onProductChange?: (product: string) => void;
}

const Menu: React.FC<MenuProps> = ({ 
  className = '',
  selectedCountries = ["EU27_2020"],
  onCountriesChange,
  selectedProduct = "6000",
  onProductChange
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [countries, setCountries] = useState<string[]>(selectedCountries);
  const [product, setProduct] = useState<string>(selectedProduct);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Sync countries and product state with props
  useEffect(() => {
    setCountries(selectedCountries);
  }, [selectedCountries]);

  useEffect(() => {
    setProduct(selectedProduct);
  }, [selectedProduct]);

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

  // Get energy product options
  const energyProductOptions = getEnergyProductOptions().map(option => ({
    ...option,
    label: t(`energy.products.${option.value}`, option.label)
  }));

  // Create country option groups
  const countryOptionGroups = [
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
  ];

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
      <button
        ref={buttonRef}
        id="menu-toggle-button"
        className={`menu-toggle ${isOpen ? 'active' : ''}`}
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-controls="dropdown-menu"
        aria-haspopup="menu"
        aria-label={t('menu.toggle', 'Toggle menu') + (isOpen ? ', menu is open' : ', menu is closed')}
        type="button"
      >
        <i 
          className={`fa ${isOpen ? 'fa-times' : 'fa-bars'}`} 
          aria-hidden="true"
        ></i>
      </button>

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
          aria-orientation="vertical"
        >
          <div className="menu-content">
            {/* Energy Product Selection Section */}
            <div className="menu-section">
              <h3 id="product-heading">{t('energy.products.label', 'Select Energy Product')}</h3>
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

            {/* Countries Selection Section */}
            <div className="menu-section">
              <h3 id="countries-heading">{t('nav.countries.label', 'Select Countries')}</h3>
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

            {/* Menu items will be added here */}
            <div className="menu-section">
              <h3 id="navigation-heading">{t('menu.navigation', 'Navigation')}</h3>
              <ul className="menu-list" role="group" aria-labelledby="navigation-heading">
                <li>
                  <a 
                    href="#" 
                    role="menuitem"
                    tabIndex={isOpen ? 0 : -1}
                    onClick={(e) => {
                      e.preventDefault();
                      setIsOpen(false);
                      announceToScreenReader('Navigating to Home');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsOpen(false);
                        announceToScreenReader('Navigating to Home');
                      }
                    }}
                  >
                    {t('menu.home', 'Home')}
                  </a>
                </li>
                <li>
                  <a 
                    href="#" 
                    role="menuitem"
                    tabIndex={isOpen ? 0 : -1}
                    onClick={(e) => {
                      e.preventDefault();
                      setIsOpen(false);
                      announceToScreenReader('Navigating to Data');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsOpen(false);
                        announceToScreenReader('Navigating to Data');
                      }
                    }}
                  >
                    {t('menu.data', 'Data')}
                  </a>
                </li>
                <li>
                  <a 
                    href="#" 
                    role="menuitem"
                    tabIndex={isOpen ? 0 : -1}
                    onClick={(e) => {
                      e.preventDefault();
                      setIsOpen(false);
                      announceToScreenReader('Navigating to Charts');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsOpen(false);
                        announceToScreenReader('Navigating to Charts');
                      }
                    }}
                  >
                    {t('menu.charts', 'Charts')}
                  </a>
                </li>
              </ul>
            </div>

            <div className="menu-section">
              <h3 id="tools-heading">{t('menu.tools', 'Tools')}</h3>
              <ul className="menu-list" role="group" aria-labelledby="tools-heading">
                <li>
                  <a 
                    href="#" 
                    role="menuitem"
                    tabIndex={isOpen ? 0 : -1}
                    onClick={(e) => {
                      e.preventDefault();
                      setIsOpen(false);
                      announceToScreenReader('Opening Export Data');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsOpen(false);
                        announceToScreenReader('Opening Export Data');
                      }
                    }}
                  >
                    {t('menu.export', 'Export Data')}
                  </a>
                </li>
                <li>
                  <a 
                    href="#" 
                    role="menuitem"
                    tabIndex={isOpen ? 0 : -1}
                    onClick={(e) => {
                      e.preventDefault();
                      setIsOpen(false);
                      announceToScreenReader('Opening Share');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsOpen(false);
                        announceToScreenReader('Opening Share');
                      }
                    }}
                  >
                    {t('menu.share', 'Share')}
                  </a>
                </li>
              </ul>
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
