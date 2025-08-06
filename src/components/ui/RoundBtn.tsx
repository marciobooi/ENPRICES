import React from 'react';

interface RoundBtnProps {
  icon: string; // Font Awesome icon class (e.g., 'fa-home', 'fa-user')
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost';
  ariaLabel: string; // Required for accessibility since there's no text
  title?: string; // Tooltip text
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  ariaControls?: string;
  ariaPressed?: boolean;
  id?: string;
  iconOnly?: boolean; // For compatibility, doesn't change behavior since it's always icon-only
}

const RoundBtn = React.forwardRef<HTMLButtonElement, RoundBtnProps>(({
  icon,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  size = 'medium',
  variant = 'primary',
  ariaLabel,
  title,
  ariaDescribedBy,
  ariaExpanded,
  ariaControls,
  ariaPressed,
  id,
  iconOnly: _iconOnly = true
}, ref) => {
  const getButtonClasses = () => {
    let classes = 'ecl-button ecl-button--rounded';
    
    // Add variant class
    classes += ` ecl-button--${variant}`;
    
    // Add size class if not medium (default)
    if (size === 'small') {
      classes += ' ecl-button--s';
    } else if (size === 'large') {
      classes += ' ecl-button--l';
    }
    
    // Add custom classes
    if (className) {
      classes += ` ${className}`;
    }
    
    return classes;
  };

  const getIconClasses = () => {
    let classes = 'fa';
    
    // Add the specific icon class
    if (!icon.startsWith('fa-')) {
      classes += ` fa-${icon}`;
    } else {
      classes += ` ${icon}`;
    }
    
    // Add size-specific icon classes
    if (size === 'small') {
      classes += ' fa-sm';
    } else if (size === 'large') {
      classes += ' fa-lg';
    }
    
    return classes;
  };

  return (
    <button
      ref={ref}
      id={id}
      className={getButtonClasses()}
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      aria-pressed={ariaPressed}
      title={title || ariaLabel}
    >
      <i className={getIconClasses()} aria-hidden="true"></i>
    </button>
  );
});

RoundBtn.displayName = 'RoundBtn';

export default RoundBtn;
