import React, { useRef, useState } from 'react';
import { Tooltip } from 'react-tooltip';
import type { TooltipAccessibilityProps } from './types/accessibility';

export interface AccessibleTooltipProps extends TooltipAccessibilityProps {
  /** The ID of the tooltip */
  id: string;
  /** The content of the tooltip */
  content: string;
  /** The placement of the tooltip */
  place?: 'top' | 'bottom' | 'left' | 'right';
  /** Delay before showing the tooltip (in ms) */
  delayShow?: number;
  /** Delay before hiding the tooltip (in ms) */
  delayHide?: number;
  /** Whether the tooltip is clickable */
  clickable?: boolean;
  /** Children to render (typically the trigger element) */
  children: React.ReactNode;
  /** Custom class name for the tooltip */
  className?: string;
}

/**
 * Accessible Tooltip component that supports keyboard navigation
 * - Press Enter or Space to show tooltip when element is focused
 * - Press Escape to close tooltip
 * - Automatically shows on focus for keyboard users
 */
export const AccessibleTooltip: React.FC<AccessibleTooltipProps> = ({
  id,
  content,
  place = 'top',
  delayShow = 500,
  delayHide = 300,
  clickable = false,
  children,
  className = '',
  showOnFocus = true,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  tabIndex,
  onFocus,
  onBlur,
  onKeyDown,
  ...rest
}) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);

  // Handle keyboard interactions
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Call custom keydown handler first
    if (onKeyDown) {
      onKeyDown(event);
    }

    // Handle tooltip-specific keyboard interactions
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      // Show tooltip programmatically
      setIsTooltipVisible(true);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      // Hide tooltip
      setIsTooltipVisible(false);
    }
  };

  const handleFocus = (event: React.FocusEvent) => {
    if (onFocus) {
      onFocus(event);
    }

    if (showOnFocus) {
      // Show tooltip on focus for keyboard users
      setIsTooltipVisible(true);
    }
  };

  const handleBlur = (event: React.FocusEvent) => {
    if (onBlur) {
      onBlur(event);
    }

    // Hide tooltip on blur
    setIsTooltipVisible(false);
  };

  // Clone children with accessibility props
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      const enhancedProps: any = {
        'data-tooltip-id': id,
        'data-tooltip-content': content,
        'aria-label': ariaLabel,
        'aria-describedby': ariaDescribedBy || (isTooltipVisible ? id : undefined),
        tabIndex: tabIndex !== undefined ? tabIndex : 0,
        onFocus: handleFocus,
        onBlur: handleBlur,
        onKeyDown: handleKeyDown,
        ...rest
      };

      // Handle ref assignment properly
      if (triggerRef.current !== null) {
        // If there's already a ref, we need to merge them
        const existingRef = (child as any).ref;
        if (existingRef) {
          enhancedProps.ref = (node: HTMLElement) => {
            triggerRef.current = node;
            if (typeof existingRef === 'function') {
              existingRef(node);
            } else if (existingRef && 'current' in existingRef) {
              existingRef.current = node;
            }
          };
        } else {
          enhancedProps.ref = triggerRef;
        }
      } else {
        enhancedProps.ref = triggerRef;
      }

      return React.cloneElement(child, enhancedProps);
    }
    return child;
  });

  return (
    <>
      {enhancedChildren}
      <Tooltip
        id={id}
        place={place}
        delayShow={delayShow}
        delayHide={delayHide}
        clickable={clickable}
        className={`accessible-tooltip ${className}`}
        isOpen={isTooltipVisible}
        setIsOpen={setIsTooltipVisible}
        role="tooltip"
        aria-live="polite"
      />
    </>
  );
};

export default AccessibleTooltip;