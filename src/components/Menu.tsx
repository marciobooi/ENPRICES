import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PoliteLiveRegion } from './ui/index';

interface MenuProps {
  className?: string;
}

const Menu: React.FC<MenuProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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
          ref={menuRef}
          id="dropdown-menu"
          className="menu-dropdown"
          role="menu"
          aria-labelledby="menu-toggle-button"
          aria-orientation="vertical"
        >
          <div className="menu-content">
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
