import React, { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FocusTrap } from "focus-trap-react";
import { Tooltip } from "react-tooltip";
import {
  PoliteLiveRegion,
  EclMultiSelect,
  EclSingleSelect,
  RoundBtn,
} from "./ui/index";
import { useQuery } from "../context/QueryContext";
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
  getDefaultUnitByContext,
} from "../data/energyData";

interface MenuProps {
  className?: string;
}

const Menu: React.FC<MenuProps> = ({ className = "" }) => {
  const { t } = useTranslation();
  const { state, dispatch } = useQuery();

  const [isOpen, setIsOpen] = useState(false);
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isInitialMountRef = useRef(true);

  // Extract values from global state
  const {
    geos: countries,
    product,
    consumer,
    consoms: band,
    unit,
    drillDownCountry, // Add this to ensure re-render when drill-down state changes
  } = state;

  // Temporary countries selection - only applied when Apply is pressed
  const [tempCountries, setTempCountries] = useState<string[]>(countries);
  
  // Force re-render when drill-down state changes
  const [, forceUpdate] = useState({});
  
  // Watch for drill-down state changes to ensure menu button updates immediately
  useEffect(() => {
    // Force component re-render when drillDownCountry changes
    forceUpdate({});
  }, [drillDownCountry]);

  // Sync tempCountries with global state when it changes externally
  useEffect(() => {
    setTempCountries(countries);
  }, [countries]);

  // Listen for ECL Apply button clicks
  useEffect(() => {
    const handleApplyClick = (event: Event) => {
      const target = event.target as HTMLElement;
      // Check if the clicked element is the ECL Apply button
      if (target.classList.contains('ecl-button') && 
          target.classList.contains('ecl-button--primary') && 
          target.textContent?.trim() === 'Apply') {
        console.log('[Menu] ECL Apply button clicked, applying countries:', tempCountries);
        dispatch({ type: "APPLY_COUNTRIES", payload: tempCountries });
      }
    };

    // Add event listener to document to catch ECL Apply button clicks
    document.addEventListener('click', handleApplyClick);

    return () => {
      document.removeEventListener('click', handleApplyClick);
    };
  }, [tempCountries, dispatch]);

  // Dynamic dataset selection: when product or consumer changes, update band and unit defaults
  useEffect(() => {
    // Skip updates on initial mount to prevent unnecessary API calls
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    const newDefaultBand = getDefaultConsumptionBandByContext(
      product,
      consumer,
      state.component
    );
    const newDefaultUnit = getDefaultUnitByContext(
      product,
      consumer,
      state.component
    );

    // Only update if the current values are no longer valid for this dataset
    const validBandOptions = getConsumptionBandOptionsByContext(
      product,
      consumer,
      state.component
    );
    const validUnitOptions = getUnitOptionsByContext(
      product,
      consumer,
      state.component
    );

    const isBandValid = validBandOptions.some(
      (option) => option.value === band
    );
    const isUnitValid = validUnitOptions.some(
      (option) => option.value === unit
    );

    // Batch updates to prevent multiple re-renders
    const updates: Array<() => void> = [];
    
    // Always update to the default values when component state changes
    // This ensures we use the appropriate defaults for each dataset type
    if (state.component) {
      // When switching to component view, always use component dataset defaults
      if (band !== newDefaultBand) {
        updates.push(() => dispatch({ type: "SET_BAND", payload: newDefaultBand }));
      }
      if (unit !== newDefaultUnit) {
        updates.push(() => dispatch({ type: "SET_UNIT", payload: newDefaultUnit }));
      }
    } else {
      // When switching to regular view, update only if current values are not valid
      if (!isBandValid) {
        updates.push(() => dispatch({ type: "SET_BAND", payload: newDefaultBand }));
      }
      if (!isUnitValid) {
        updates.push(() => dispatch({ type: "SET_UNIT", payload: newDefaultUnit }));
      }
    }

    // Execute all updates in sequence to batch them
    if (updates.length > 0) {
      updates.forEach(update => update());
    }
  }, [product, consumer, state.component, dispatch, band, unit]); // Added band and unit as dependencies

  // Global state handlers
  const handleCountryChange = (selectedValues: string[]) => {
    console.log('[Menu] Country selection changed:', selectedValues);
    // Only update temporary state, don't apply to chart yet
    setTempCountries(selectedValues);
  };

  const handleProductChange = (selectedValue: string) => {
    dispatch({ type: "SET_PRODUCT", payload: selectedValue });
  };

  const handleConsumerChange = (selectedValue: string) => {
    dispatch({ type: "SET_CONSUMER", payload: selectedValue });
  };

  const handleBandChange = (selectedValue: string) => {
    dispatch({ type: "SET_BAND", payload: selectedValue });
  };

  const handleUnitChange = (selectedValue: string) => {
    dispatch({ type: "SET_UNIT", payload: selectedValue });
  };



  // Get energy product options - memoized
  const energyProductOptions = useMemo(() => {
    return getEnergyProductOptions().map((option) => ({
      ...option,
      label: t(`energy.products.${option.value}`, option.label),
    }));
  }, [t]);

  // Get energy consumer options - memoized
  const energyConsumerOptions = useMemo(() => {
    return getEnergyConsumerOptions().map((option) => ({
      ...option,
      label: t(`energy.consumers.${option.value}`, option.label),
    }));
  }, [t]);

  // Get energy band options (based on current product and consumer) - memoized
  const energyBandOptions = useMemo(() => {
    return getConsumptionBandOptionsByContext(
      product,
      consumer,
      state.component
    ).map((option: { value: string; label: string }) => ({
      ...option,
      label: t(`energy.bands.${option.value}`, option.label),
    }));
  }, [product, consumer, state.component, t]);

  // Get energy unit options (based on current product and consumer) - memoized
  const energyUnitOptions = useMemo(() => {
    return getUnitOptionsByContext(product, consumer, state.component).map(
      (option: { value: string; label: string }) => ({
        ...option,
        label: t(`energy.units.${option.value}`, option.label),
      })
    );
  }, [product, consumer, state.component, t]);

  // Create country option groups - memoized
  const countryOptionGroups = useMemo(
    () => [
      {
        label: t("countries.groups.aggregates", "EU Aggregates"),
        options: AGGREGATES_COUNTRY_CODES.map((code) => ({
          value: code,
          label: t(`countries.${code}`, code),
        })),
      },
      {
        label: t("countries.groups.eu", "EU Member States"),
        options: EU_COUNTRY_CODES.map((code) => ({
          value: code,
          label: t(`countries.${code}`, code),
        })),
      },
      {
        label: t("countries.groups.efta", "EFTA Countries"),
        options: EFTA_COUNTRY_CODES.map((code) => ({
          value: code,
          label: t(`countries.${code}`, code),
        })),
      },
      {
        label: t("countries.groups.enlargement", "Enlargement Countries"),
        options: ENLARGEMENT_COUNTRY_CODES.map((code) => ({
          value: code,
          label: t(`countries.${code}`, code),
        })),
      },
    ],
    [t]
  );

  const toggleMenu = () => {
    const newIsOpen = !isOpen;
    console.log('[Menu] Toggle menu - current isOpen:', isOpen, 'new isOpen:', newIsOpen);
    setIsOpen(newIsOpen);

    // Announce state change to screen readers
    const announcement = newIsOpen
      ? t("ui.menu.opened", "Menu opened")
      : t("ui.menu.closed", "Menu closed");
    announceToScreenReader(announcement);
  };

  const announceToScreenReader = (message: string) => {
    setAnnouncementMessage(message);
    // Clear announcement after a short delay to allow for new announcements
    setTimeout(() => setAnnouncementMessage(""), 100);
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={`menu-container ${className}`}>
      {/* Dropdown Menu with Focus Trap */}
      {isOpen && (
        <FocusTrap
          active={isOpen}
          focusTrapOptions={{
            initialFocus: "#menu-toggle-button",
            allowOutsideClick: true,
            clickOutsideDeactivates: true,
            setReturnFocus: (
              nodeFocusedBeforeActivation: HTMLElement | SVGElement
            ) => buttonRef.current || nodeFocusedBeforeActivation,
            escapeDeactivates: true,
            onDeactivate: () => {
              setIsOpen(false);
              announceToScreenReader(t("ui.menu.closed", "Menu closed"));
            },
          }}
        >
          <div>
            {/* Hamburger Menu Button */}
            <RoundBtn
              ref={buttonRef}
              id="menu-toggle-button"
              className={isOpen ? "active" : ""}
              onClick={toggleMenu}
              disabled={!!drillDownCountry} // Disable menu when in bands view
              ariaExpanded={isOpen}
              ariaControls="dropdown-menu"
              ariaLabel={
                drillDownCountry 
                  ? t("menu.disabled_in_bands", "Menu disabled in bands view") 
                  : t("menu.toggle", "Toggle menu") +
                    (isOpen
                      ? t("ui.menu.is_open", ", menu is open")
                      : t("ui.menu.is_closed", ", menu is closed"))
              }
              variant="ghost"
              size="medium"
              icon={isOpen ? "fa-times" : "fa-bars"}
              iconOnly={true}
              data-tooltip-id="menu-close-tooltip"
              data-tooltip-content={t("tooltips.menu.close")}
              data-tooltip-place="bottom"
            />
            <Tooltip
              id="menu-close-tooltip"
              place="bottom"
              delayShow={200}
              delayHide={100}
              noArrow={true}
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
                  <div className="menuRow">
                    {/* First Row: Countries, Fuel (Product), Consumer */}

                    {/* Countries Selection Section */}
                    <div className="menu-section">
                      <div className="menu-countries">
                        <EclMultiSelect
                          id="menu-select-countries"
                          label={t("nav.countries.label", "Select Countries")}
                          optionGroups={countryOptionGroups}
                          values={tempCountries}
                          onChange={handleCountryChange}
                          placeholder={t(
                            "nav.countries.placeholder",
                            "Choose countries..."
                          )}
                          helpText={t(
                            "nav.countries.help",
                            "Select up to 10 countries to compare"
                          )}
                          required={true}
                        />
                      </div>
                    </div>

                    {/* Energy Product (Fuel) Selection Section */}
                    <div className="menu-section">
                      <div className="menu-product">
                        <EclSingleSelect
                          id="menu-select-product"
                          label={t(
                            "energy.products.label",
                            "Select Energy Product"
                          )}
                          options={energyProductOptions}
                          value={product}
                          onChange={handleProductChange}
                          placeholder={t(
                            "energy.products.placeholder",
                            "Choose an energy product..."
                          )}
                          helpText={t(
                            "energy.products.help",
                            "Select the energy product you want to analyze"
                          )}
                          required={true}
                        />
                      </div>
                    </div>

                    {/* Energy Consumer Selection Section */}
                    <div className="menu-section">
                      <div className="menu-consumer">
                        <EclSingleSelect
                          id="menu-select-consumer"
                          label={t(
                            "energy.consumers.label",
                            "Select Consumer Type"
                          )}
                          options={energyConsumerOptions}
                          value={consumer}
                          onChange={handleConsumerChange}
                          placeholder={t(
                            "energy.consumers.placeholder",
                            "Choose a consumer type..."
                          )}
                          helpText={t(
                            "energy.consumers.help",
                            "Select household or non-household consumers"
                          )}
                          required={true}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="menuRow">
                    {/* Second Row: Consumption Band, Unit */}

                    {/* Energy Band (Consumption) Selection Section */}
                    <div className="menu-section">
                      <div className="menu-band">
                        <EclSingleSelect
                          id="menu-select-band"
                          label={t(
                            "energy.bands.label",
                            "Select Consumption Band"
                          )}
                          options={energyBandOptions}
                          value={band}
                          onChange={handleBandChange}
                          placeholder={t(
                            "energy.bands.placeholder",
                            "Choose a consumption band..."
                          )}
                          helpText={t(
                            "energy.bands.help",
                            "Select the energy consumption band for analysis"
                          )}
                          required={true}
                        />
                      </div>
                    </div>

                    {/* Energy Unit Selection Section */}
                    <div className="menu-section">
                      <div className="menu-unit">
                        <EclSingleSelect
                          id="menu-select-unit"
                          label={t("energy.units.label", "Select Unit")}
                          options={energyUnitOptions}
                          value={unit}
                          onChange={handleUnitChange}
                          placeholder={t(
                            "energy.units.placeholder",
                            "Choose a unit..."
                          )}
                          helpText={t(
                            "energy.units.help",
                            "Select the unit for energy price display"
                          )}
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
        <>
          <RoundBtn
            ref={buttonRef}
            id="menu-toggle-button"
            className={isOpen ? "active" : ""}
            onClick={toggleMenu}
            disabled={!!drillDownCountry} // Disable menu when in bands view
            ariaExpanded={isOpen}
            ariaControls="dropdown-menu"
            ariaLabel={
              drillDownCountry 
                ? t("menu.disabled_in_bands", "Menu disabled in bands view") 
                : t("menu.toggle", "Toggle menu") +
                  (isOpen
                    ? t("ui.menu.is_open", ", menu is open")
                    : t("ui.menu.is_closed", ", menu is closed"))
            }
            variant="ghost"
            size="medium"
            icon={isOpen ? "fa-times" : "fa-bars"}
            iconOnly={true}
            data-tooltip-id="menu-toggle-tooltip"
            data-tooltip-content={t("tooltips.menu.toggle")}
            data-tooltip-place="bottom"
          />
          <Tooltip
            id="menu-toggle-tooltip"
            place="bottom"
            delayShow={200}
            delayHide={100}
            noArrow={true}
          />
        </>
      )}

      {/* Screen reader announcements */}
      <PoliteLiveRegion>{announcementMessage}</PoliteLiveRegion>
    </div>
  );
};

export default Menu;
