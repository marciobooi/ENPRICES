import React from 'react';
import type { ScreenReaderOnlyProps } from './types/accessibility';

/**
 * Component for text that is only visible to screen readers
 * Useful for providing additional context or instructions
 */
const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <span 
      className={`sr-only ${className}`}
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0
      }}
    >
      {children}
    </span>
  );
};

export default ScreenReaderOnly;
