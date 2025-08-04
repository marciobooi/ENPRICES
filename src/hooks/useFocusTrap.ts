import { useEffect, useRef } from 'react';

/**
 * Custom hook for trapping focus within a container element
 * Ensures keyboard navigation stays within the specified element when active
 * 
 * @param isActive - Whether the focus trap should be active
 * @param restoreFocus - Whether to restore focus to the previously focused element when deactivated
 * @returns containerRef - Ref to attach to the container element
 */
export const useFocusTrap = (
  isActive: boolean,
  restoreFocus: boolean = true,
  onClose?: () => void
) => {
  const containerRef = useRef<HTMLElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Store the previously focused element
    if (restoreFocus && document.activeElement) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
    }

    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements within the container
    const getFocusableElements = (): NodeListOf<HTMLElement> => {
      return container.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled]), [contenteditable="true"]'
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      if (event.shiftKey) {
        // Shift + Tab - going backwards
        if (document.activeElement === firstFocusable || !container.contains(document.activeElement)) {
          event.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        // Tab - going forwards
        if (document.activeElement === lastFocusable || !container.contains(document.activeElement)) {
          event.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    // Focus the first focusable element when trap becomes active
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Add event listener for tab/escape key
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to the previously focused element
      if (restoreFocus && previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [isActive, restoreFocus, onClose]);

  return containerRef;
};

/**
 * Custom hook for managing focus within a dropdown or select component
 * Provides specific behavior for dropdown interactions
 * 
 * @param isOpen - Whether the dropdown is open
 * @param onClose - Callback function to close the dropdown
 * @returns Object containing refs and handlers
 */
export const useDropdownFocus = (isOpen: boolean, onClose: () => void) => {
  const triggerRef = useRef<HTMLElement>(null);
  const dropdownRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          onClose();
          triggerRef.current?.focus();
          break;
        
        case 'Tab':
          // Allow normal tab behavior but close dropdown if tabbing out
          const dropdown = dropdownRef.current;
          if (dropdown && !dropdown.contains(event.target as Node)) {
            onClose();
          }
          break;
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = dropdownRef.current;
      const trigger = triggerRef.current;
      
      if (
        dropdown && 
        trigger && 
        !dropdown.contains(event.target as Node) && 
        !trigger.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return {
    triggerRef,
    dropdownRef,
    
    // Keyboard event handlers for the trigger element
    triggerKeyDown: (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'Enter':
        case ' ':
        case 'ArrowDown':
        case 'ArrowUp':
          event.preventDefault();
          if (!isOpen) {
            // Open dropdown and focus first item if available
            setTimeout(() => {
              const dropdown = dropdownRef.current;
              if (dropdown) {
                const firstFocusable = dropdown.querySelector(
                  'button, [tabindex]:not([tabindex="-1"]), input, select, textarea'
                ) as HTMLElement;
                firstFocusable?.focus();
              }
            }, 0);
          }
          break;
        case 'Escape':
          if (isOpen) {
            event.preventDefault();
            onClose();
          }
          break;
      }
    }
  };
};
