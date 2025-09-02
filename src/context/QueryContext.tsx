import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import { allCountries } from '../data/energyData';

// Define the global query state interface
export interface QueryState {
  chartGeo: string;
  chartId: string;
  chartInDetails: boolean;
  component: boolean;
  consoms: string;
  consumer: string;
  currency: string;
  dataset: string;
  decimals: number; // 1-4 decimal places for number formatting
  details: boolean;
  geos: string[];
  appliedGeos: string[]; // Countries currently applied to the chart
  hideAggregates: boolean; // Toggle to hide EU aggregates
  language: string;
  nrg_prc: string[];
  order: 'proto' | 'alfa' | 'asc' | 'desc'; // Chart ordering options
  percentage: boolean;
  product: string;
  share: boolean;
  taxs: string[];
  time: string;
  unit: string;
  availableYears: string[]; // Dynamic years from API
  isLoadingYears: boolean;
  drillDownCountry: string | null; // Country selected for drill-down to bands view
}

// Define action types for query updates
export type QueryAction =
  | { type: 'SET_COUNTRIES'; payload: string[] }
  | { type: 'APPLY_COUNTRIES'; payload: string[] }
  | { type: 'SET_PRODUCT'; payload: string }
  | { type: 'SET_CONSUMER'; payload: string }
  | { type: 'SET_YEAR'; payload: string }
  | { type: 'SET_BAND'; payload: string }
  | { type: 'SET_UNIT'; payload: string }
  | { type: 'SET_DATASET'; payload: string }
  | { type: 'SET_LANGUAGE'; payload: string }
  | { type: 'SET_CURRENCY'; payload: string }
  | { type: 'SET_ORDER'; payload: 'proto' | 'alfa' | 'asc' | 'desc' }
  | { type: 'SET_DECIMALS'; payload: number }
  | { type: 'SET_DETAILS'; payload: boolean }
  | { type: 'SET_PERCENTAGE'; payload: boolean }
  | { type: 'SET_HIDE_AGGREGATES'; payload: boolean }
  | { type: 'SET_SHARE'; payload: boolean }
  | { type: 'SET_COMPONENT'; payload: boolean }
  | { type: 'SET_AVAILABLE_YEARS'; payload: string[] }
  | { type: 'SET_LOADING_YEARS'; payload: boolean }
  | { type: 'SET_DRILL_DOWN_COUNTRY'; payload: string | null }
  | { type: 'RESET_TO_DEFAULTS' };

// Initial state with all countries selected by default
const initialState: QueryState = {
  chartGeo: "CY",
  chartId: "mainChart",
  chartInDetails: false,
  component: false,
  consoms: "KWH_LT1000",
  consumer: "HOUSEHOLD",
  currency: "EUR",
  dataset: "nrg_pc_204",
  decimals: 4, // Default 4 decimal places
  details: false,
  geos: [...allCountries], // All countries by default instead of just EU
  appliedGeos: [...allCountries], // Applied countries start same as selected
  hideAggregates: false, // Show aggregates by default
  language: "EN",
  nrg_prc: [], // Will be populated based on component and dataset selection
  order: "desc", // Fixed to match type
  percentage: false,
  product: "6000",
  share: false,
  taxs: ["X_TAX", "X_VAT", "I_TAX"],
  time: `${new Date().getFullYear()}-S2`, // Current year, second semester
  unit: "KWH",
  availableYears: [],
  isLoadingYears: false,
  drillDownCountry: null, // No country selected for drill-down initially
};

// Reducer function to handle state updates
const queryReducer = (state: QueryState, action: QueryAction): QueryState => {
  switch (action.type) {
    case 'SET_COUNTRIES':
      console.log('[QueryContext] SET_COUNTRIES:', action.payload);
      return {
        ...state,
        geos: action.payload
      };
    case 'APPLY_COUNTRIES':
      console.log('[QueryContext] APPLY_COUNTRIES:', action.payload);
      return {
        ...state,
        appliedGeos: action.payload
      };
    case 'SET_PRODUCT':
      return {
        ...state,
        product: action.payload
      };
    case 'SET_CONSUMER':
      return {
        ...state,
        consumer: action.payload
      };
    case 'SET_YEAR':
      return {
        ...state,
        time: action.payload
      };
    case 'SET_BAND':
      return {
        ...state,
        consoms: action.payload,
        drillDownCountry: null // Exit bands view when band changes
      };
    case 'SET_UNIT':
      return {
        ...state,
        unit: action.payload
      };
    case 'SET_DATASET':
      return {
        ...state,
        dataset: action.payload
      };
    case 'SET_LANGUAGE':
      return {
        ...state,
        language: action.payload
      };
    case 'SET_CURRENCY':
      return {
        ...state,
        currency: action.payload
      };
    case 'SET_ORDER':
      return {
        ...state,
        order: action.payload
      };
    case 'SET_DECIMALS':
      return {
        ...state,
        decimals: action.payload
      };
    case 'SET_DETAILS':
      return {
        ...state,
        details: action.payload
      };
    case 'SET_PERCENTAGE':
      return {
        ...state,
        percentage: action.payload
      };
    case 'SET_HIDE_AGGREGATES':
      return {
        ...state,
        hideAggregates: action.payload
      };
    case 'SET_SHARE':
      return {
        ...state,
        share: action.payload
      };
    case 'SET_COMPONENT':
      return {
        ...state,
        component: action.payload
      };
    case 'SET_AVAILABLE_YEARS':
      return {
        ...state,
        availableYears: action.payload
      };
    case 'SET_LOADING_YEARS':
      return {
        ...state,
        isLoadingYears: action.payload
      };
    case 'SET_DRILL_DOWN_COUNTRY':
      return {
        ...state,
        drillDownCountry: action.payload
      };
    case 'RESET_TO_DEFAULTS':
      return initialState;
    default:
      return state;
  }
};

// Create context
interface QueryContextType {
  state: QueryState;
  dispatch: React.Dispatch<QueryAction>;
}

const QueryContext = createContext<QueryContextType | undefined>(undefined);

// Context provider component
export const QueryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(queryReducer, initialState);

  return (
    <QueryContext.Provider value={{ state, dispatch }}>
      {children}
    </QueryContext.Provider>
  );
};

// Custom hook to use the query context
export const useQuery = () => {
  const context = useContext(QueryContext);
  if (context === undefined) {
    throw new Error('useQuery must be used within a QueryProvider');
  }
  return context;
};

// Helper function to get current query configuration
export const getQueryConfig = (state: QueryState) => {
  return {
    countries: state.geos,
    product: state.product,
    consumer: state.consumer,
    year: state.time,
    band: state.consoms,
    unit: state.unit,
    dataset: state.dataset,
    currency: state.currency,
    language: state.language,
    details: state.details,
    percentage: state.percentage,
    share: state.share,
    component: state.component,
    order: state.order
  };
};
