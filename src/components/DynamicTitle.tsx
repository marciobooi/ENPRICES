import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '../context/QueryContext';


interface DynamicTitleProps {
  className?: string;
}

const DynamicTitle: React.FC<DynamicTitleProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const { state } = useQuery();

  // Helper function to get product name
  const getProductName = (product: string) => {
    switch (product) {
      case '6000':
        return t('title.electricity');
      case '4100':
        return t('title.gas');
      default:
        return t('title.electricity');
    }
  };

  // Helper function to get consumer type
  const getConsumerType = (consumer: string) => {
    switch (consumer) {
      case 'HOUSEHOLD':
        return t('title.household');
      case 'N_HOUSEHOLD':
        return t('title.nonHousehold');
      default:
        return t('title.household');
    }
  };

  // Helper function to get currency symbol
  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'EUR':
        return '€';
      case 'PPS':
        return 'PPS';
      case 'NAT':
        return 'NAT';
      default:
        return '€';
    }
  };

  // Helper function to get unit symbol
  const getUnitSymbol = (unit: string) => {
    switch (unit) {
      case 'KWH':
        return 'kWh';
      case 'MWH':
        return 'MWh';
      case 'GJ_GCV':
        return 'GJ';
      default:
        return 'kWh';
    }
  };

  // Helper function to format period
  const formatPeriod = (time: string) => {
    // Extract year and semester from time like "2024-S2"
    if (time.includes('-S')) {
      return time; // Already in correct format
    }
    
    // If it's just a year, default to S2
    const currentYear = new Date().getFullYear();
    return `${time || currentYear}-S2`;
  };

  // Helper function to get band label
  const getBandLabel = (consoms: string) => {
    // Use the translation key for the band
    const bandKey = `energy.bands.${consoms}`;
    const bandLabel = t(bandKey);
    
    // If translation not found, return the key itself formatted
    if (bandLabel === bandKey) {
      return consoms.replace(/_/g, ' ');
    }
    
    return bandLabel;
  };

  const productName = getProductName(state.product);
  const consumerType = getConsumerType(state.consumer);
  const currencySymbol = getCurrencySymbol(state.currency);
  const unitSymbol = getUnitSymbol(state.unit);
  const period = formatPeriod(state.time);
  const bandLabel = getBandLabel(state.consoms);

  // Band subtitle logic (only show if not "all bands" and not in component view)
  const showBandSubtitle = !state.component && state.consoms && 
    !state.consoms.includes('TOT_') && 
    !state.consoms.includes('4161900') && 
    !state.consoms.includes('4141900') && 
    !state.consoms.includes('4162900') &&
    !state.consoms.includes('4142900');

  // Main title - different for component view
  const mainTitle = state.component 
    ? `Electricity components for prices for household consumers - annual data (from 2007 onwards) (€/kWh) ${state.time.split('-')[0]}`
    : t('title.main', {
        productName,
        consumerType,
        currency: currencySymbol,
        unit: unitSymbol,
      });

  // Band subtitle - different for component view
  const bandSubtitle = state.component
    ? `All bands: Consumption of kWh - ${state.time.split('-')[0]}`
    : (showBandSubtitle ? t('title.band', {
        bandLabel,
        period
      }) : '');

  return (
    <div className={`dynamic-title ${className}`}>
  
            <div className="title-with-info">
              <h6 className="ecl-u-type-heading-1 ecl-u-color-blue toolTitle">{mainTitle}</h6>
              <h6 className="ecl-u-type-heading-1 ecl-u-color-blue subToolTitle">{bandSubtitle}</h6> 
            </div>
            
          </div>

  );
};

export default DynamicTitle;
