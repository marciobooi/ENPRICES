
import React from 'react';
import type { ReactNode } from 'react';
import MainChart from './MainChart';
import FloatingMenu from './FloatingMenu';
import { TimeSlider } from './ui';
import { useQuery } from '../context/QueryContext';
import { useDynamicYears } from '../hooks/useDynamicYears';

interface MainContentProps {
  children?: ReactNode;
  className?: string;
}

const MainContent: React.FC<MainContentProps> = ({ children, className }) => {
  const { state, dispatch } = useQuery();
  
  // Load dynamic years data
  useDynamicYears();
  
  return (
    <main id="main-content" className={`main-content ${className ?? ''}`} tabIndex={-1}>
      <div className="main-content__container">
        <div className="ecl-row">
          <div className="ecl-col-12">
            <MainChart />
            
            {/* Time Period Slider - placed below chart */}
            <TimeSlider
                timeOptions={state.availableYears}
                selectedTime={state.time}
                onChange={(time) => {
                  dispatch({ type: 'SET_YEAR', payload: time });
                }}
              />
          </div>
        </div>

        {children}
      </div>
      <FloatingMenu />
    </main>
  );
};

export default MainContent;
