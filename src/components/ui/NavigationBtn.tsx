import React, { useRef, useEffect, useState } from 'react';
import { PoliteLiveRegion } from './LiveRegion';

interface NavigationBtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'call' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  iconPosition?: 'before' | 'after';
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  ariaControls?: string;
  isActive?: boolean;
}

const NavigationBtn: React.FC<NavigationBtnProps> = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  variant = 'tertiary',
  size = 'medium',
  icon,
  iconPosition = 'after',
  ariaLabel,
  ariaDescribedBy,
  ariaExpanded,
  ariaControls,
  isActive = false
}) => {
  const [announce, setAnnounce] = useState<string | null>(null);
  const prevActive = useRef(isActive);
  useEffect(() => {
    if (isActive !== prevActive.current) {
      setAnnounce(isActive ? 'Selected' : 'Deselected');
      prevActive.current = isActive;
      const timer = setTimeout(() => setAnnounce(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [isActive]);
  const getButtonClasses = () => {
    let classes = 'ecl-button';
    
    // Add variant class - use primary for active state
    const activeVariant = isActive ? 'primary' : variant;
    classes += ` ecl-button--${activeVariant}`;
    
    // Add size class if not medium (default)
    if (size === 'small') {
      classes += ' ecl-button--s';
    } else if (size === 'large') {
      classes += ' ecl-button--l';
    }
    
    // Add active state class
    if (isActive) {
      classes += ' ecl-button--active';
    }
    
    // Add custom classes
    if (className) {
      classes += ` ${className}`;
    }
    
    return classes;
  };

  return (
    <>
      <button
        className={getButtonClasses()}
        type={type}
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
      >
        {icon && iconPosition === 'before' && (
          <span className="ecl-button__icon ecl-button__icon--before">
            {icon}
          </span>
        )}
        <span className="ecl-button__label" data-ecl-label="true">
          {children}
        </span>
        {icon && iconPosition === 'after' && (
          <span className="ecl-button__icon ecl-button__icon--after">
            {icon}
          </span>
        )}
      </button>
      {announce && <PoliteLiveRegion>{announce}</PoliteLiveRegion>}
    </>
  );
};

export default NavigationBtn;
