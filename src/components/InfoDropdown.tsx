import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '../context/QueryContext';
import RoundBtn from './ui/RoundBtn';
import { Tooltip } from 'react-tooltip';

interface InfoDropdownProps {
  className?: string;
}

const InfoDropdown: React.FC<InfoDropdownProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const { state } = useQuery();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Generate metadata URL based on current dataset
  const getMetadataUrl = () => {
    // Use the dataset from query state or default to nrg_pc_204
    const dataset = state.dataset || 'nrg_pc_204';
    return `https://ec.europa.eu/eurostat/cache/metadata/EN/${dataset}_sims.htm`;
  };

  // Generate feedback email link
  const getFeedbackEmailLink = () => {
    const subject = encodeURIComponent('Energy prices');
    const body = encodeURIComponent(
      'This visualisation tool, created by Eurostat, displays electricity and natural gas prices in the EU and other European countries with a great level of detail. Users can interact with the data and customise the display in many different ways. https://ec.europa.eu/eurostat/cache/visualisations/energy-prices/enprices.html?geos=EU27_2020,EA,BE,BG,CZ,DK,DE,EE,IE,EL,ES,FR,HR,IT,CY,LV,LT,LU,HU,MT,NL,AT,PL,PT,RO,SI,SK,FI,SE,IS,LI,NO,ME,MK,AL,RS,TR,BA,XK,MD,UA,GE&product=6000&consumer=HOUSEHOLD&consoms=KWH_LT1000&unit=KWH&taxs=I_TAX,X_TAX,X_VAT&nrg_prc=undefined&currency=EUR&language=EN&detail=0&component=0&order=DESC&dataset=nrg_pc_204&time=2024-S2&chartInDetails=0&chartId=mainChart&chartGeo=&percentage=0&share=false'
    );
    return `mailto:ESTAT-ENERGY@ec.europa.eu?subject=${subject}&body=${body}`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key and arrow key navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      const menuItems = dropdownRef.current?.querySelectorAll('[role="menuitem"]');
      if (!menuItems) return;

      const currentIndex = Array.from(menuItems).findIndex(item => item === document.activeElement);

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          buttonRef.current?.focus();
          break;
        case 'ArrowDown':
          event.preventDefault();
          const nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
          (menuItems[nextIndex] as HTMLElement).focus();
          break;
        case 'ArrowUp':
          event.preventDefault();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
          (menuItems[prevIndex] as HTMLElement).focus();
          break;
        case 'Home':
          event.preventDefault();
          (menuItems[0] as HTMLElement).focus();
          break;
        case 'End':
          event.preventDefault();
          (menuItems[menuItems.length - 1] as HTMLElement).focus();
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    
    // Focus the first menu item when opening
    if (!isOpen) {
      setTimeout(() => {
        const firstMenuItem = dropdownRef.current?.querySelector('[role="menuitem"]') as HTMLElement;
        firstMenuItem?.focus();
      }, 100);
    }
  };

  const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>, type: 'tutorial' | 'metadata' | 'feedback') => {
    event.preventDefault();
    setIsOpen(false);
    
    switch (type) {
      case 'tutorial':
        // For now, just close the dropdown. Tutorial functionality can be added later
        console.log('Tutorial clicked - functionality to be implemented');
        break;
      case 'metadata':
        window.open(getMetadataUrl(), '_blank', 'noopener,noreferrer');
        break;
      case 'feedback':
        window.location.href = getFeedbackEmailLink();
        break;
    }
  };

  const dropdownId = 'info-dropdown-menu';
  const buttonId = 'info-dropdown-button';

  return (
    <div className={`info-dropdown ${className}`} ref={dropdownRef}>
      <RoundBtn
        ref={buttonRef}
        id={buttonId}
        icon="fa-info"
        onClick={toggleDropdown}
        ariaLabel={t('info.button.label')}
        ariaExpanded={isOpen}
        ariaControls={dropdownId}
        ariaHaspopup="menu"
        variant="secondary"
        size="medium"
        className="info-dropdown-button"
        data-tooltip-id="info-button-tooltip"
        data-tooltip-content={t('info.button.tooltip')}
      />
      
      <Tooltip
        id="info-button-tooltip"
        place="bottom"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          color: '#000000',
          border: '2px solid #004494',
          borderRadius: '4px',
          padding: '8px 12px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          zIndex: 9999,
          maxWidth: '250px'
        }}
        noArrow={true}
      />

      {/* Screen reader announcement */}
      <div 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {isOpen ? t('info.accessibility.menuOpened') : ''}
      </div>

      {isOpen && (
        <div
          id={dropdownId}
          className="info-dropdown-menu"
          role="menu"
          aria-labelledby={buttonId}
        >
          <ul className="info-dropdown-list" role="none">
            <li role="none">
              <a
                href="#tutorial"
                role="menuitem"
                className="info-dropdown-link"
                onClick={(e) => handleLinkClick(e, 'tutorial')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleLinkClick(e as any, 'tutorial');
                  }
                }}
                tabIndex={0}
                aria-describedby="tutorial-description"
              >
                <i className="fa fa-play-circle" aria-hidden="true"></i>
                <span>{t('info.menu.tutorial')}</span>
                <span id="tutorial-description" className="sr-only">
                  {t('info.accessibility.tutorialDescription')}
                </span>
              </a>
            </li>
            <li role="none">
              <a
                href="#metadata"
                role="menuitem"
                className="info-dropdown-link"
                onClick={(e) => handleLinkClick(e, 'metadata')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleLinkClick(e as any, 'metadata');
                  }
                }}
                tabIndex={0}
                aria-describedby="metadata-description"
              >
                <i className="fa fa-database" aria-hidden="true"></i>
                <span>{t('info.menu.metadata')}</span>
                <span id="metadata-description" className="sr-only">
                  {t('info.accessibility.metadataDescription')}
                </span>
              </a>
            </li>
            <li role="none">
              <a
                href="#feedback"
                role="menuitem"
                className="info-dropdown-link"
                onClick={(e) => handleLinkClick(e, 'feedback')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleLinkClick(e as any, 'feedback');
                  }
                }}
                tabIndex={0}
                aria-describedby="feedback-description"
              >
                <i className="fa fa-comment" aria-hidden="true"></i>
                <span>{t('info.menu.feedback')}</span>
                <span id="feedback-description" className="sr-only">
                  {t('info.accessibility.feedbackDescription')}
                </span>
              </a>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default InfoDropdown;
