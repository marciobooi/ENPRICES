
import React from 'react';
import type { ReactNode } from 'react';
import MainChart from './MainChart';

interface MainContentProps {
  children?: ReactNode;
  className?: string;
}

const MainContent: React.FC<MainContentProps> = ({ children, className }) => {
  return (
    <main id="main-content" className={`main-content ${className ?? ''}`} tabIndex={-1}>
      <div className="main-content__container">
 
          <div className="ecl-row">
            <div className="ecl-col-12">
              <MainChart />
            </div>
          </div>

        {children}
      </div>
    </main>
  );
};

export default MainContent;
