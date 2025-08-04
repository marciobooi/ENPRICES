/**
 * Common accessibility prop types for UI components
 * Following WCAG 2.1 AA guidelines and ARIA best practices
 */

export interface AriaProps {
  /** Provides an accessible name for the element when no visible text is present */
  'aria-label'?: string;
  
  /** References other elements that describe the current element */
  'aria-describedby'?: string;
  
  /** References other elements that label the current element */
  'aria-labelledby'?: string;
  
  /** Indicates whether the element is expanded or collapsed */
  'aria-expanded'?: boolean;
  
  /** Identifies the element that controls the current element */
  'aria-controls'?: string;
  
  /** Indicates the current state of a toggle button */
  'aria-pressed'?: boolean;
  
  /** Indicates that the element has a popup menu or dialog */
  'aria-haspopup'?: boolean | 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  
  /** Indicates whether the element is hidden from assistive technology */
  'aria-hidden'?: boolean;
  
  /** Indicates that the element is invalid */
  'aria-invalid'?: boolean | 'false' | 'true' | 'grammar' | 'spelling';
  
  /** Indicates that the element is required */
  'aria-required'?: boolean;
  
  /** Indicates that the element is disabled */
  'aria-disabled'?: boolean;
  
  /** Indicates that the element is read-only */
  'aria-readonly'?: boolean;
  
  /** Provides additional descriptive text for the element */
  'aria-description'?: string;
  
  /** Indicates the current value in a range widget */
  'aria-valuenow'?: number;
  
  /** Indicates the minimum value in a range widget */
  'aria-valuemin'?: number;
  
  /** Indicates the maximum value in a range widget */
  'aria-valuemax'?: number;
  
  /** Provides a human-readable text alternative for aria-valuenow */
  'aria-valuetext'?: string;
  
  /** Indicates the element's position in a set */
  'aria-posinset'?: number;
  
  /** Indicates the total number of items in a set */
  'aria-setsize'?: number;
  
  /** Indicates the current page in a pagination component */
  'aria-current'?: boolean | 'false' | 'true' | 'page' | 'step' | 'location' | 'date' | 'time';
}

export interface KeyboardProps {
  /** Handler for keydown events */
  onKeyDown?: (event: React.KeyboardEvent) => void;
  
  /** Handler for keyup events */
  onKeyUp?: (event: React.KeyboardEvent) => void;
  
  /** Handler for keypress events */
  onKeyPress?: (event: React.KeyboardEvent) => void;
  
  /** Tab index for keyboard navigation */
  tabIndex?: number;
}

export interface FocusProps {
  /** Handler for focus events */
  onFocus?: (event: React.FocusEvent) => void;
  
  /** Handler for blur events */
  onBlur?: (event: React.FocusEvent) => void;
  
  /** Auto focus the element when mounted */
  autoFocus?: boolean;
}

/**
 * Base accessibility props that should be included in most interactive components
 */
export interface BaseAccessibilityProps extends AriaProps, KeyboardProps, FocusProps {
  /** The role of the element for assistive technology */
  role?: string;
  
  /** Tooltip text that appears on hover/focus */
  title?: string;
  
  /** HTML id attribute for the element */
  id?: string;
  
  /** CSS classes for the element */
  className?: string;
}

/**
 * Accessibility props specific to form elements
 */
export interface FormAccessibilityProps extends BaseAccessibilityProps {
  /** Indicates that the field is required */
  required?: boolean;
  
  /** Indicates that the field is disabled */
  disabled?: boolean;
  
  /** Indicates that the field is read-only */
  readOnly?: boolean;
  
  /** The name attribute for form submission */
  name?: string;
  
  /** Associates the input with a form */
  form?: string;
}

/**
 * Accessibility props for button-like elements
 */
export interface ButtonAccessibilityProps extends BaseAccessibilityProps {
  /** The type of button */
  type?: 'button' | 'submit' | 'reset';
  
  /** Indicates that the button is disabled */
  disabled?: boolean;
  
  /** Form that this button is associated with */
  form?: string;
}

/**
 * Accessibility props for menu and navigation components
 */
export interface MenuAccessibilityProps extends BaseAccessibilityProps {
  /** Indicates whether the menu is expanded */
  'aria-expanded'?: boolean;
  
  /** References the menu items */
  'aria-controls'?: string;
  
  /** Indicates that the element has a popup menu */
  'aria-haspopup'?: 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog' | boolean;
  
  /** Current item in the menu */
  'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | boolean;
}

/**
 * Accessibility props for dialog and modal components
 */
export interface DialogAccessibilityProps extends BaseAccessibilityProps {
  /** Indicates that the dialog is modal */
  'aria-modal'?: boolean;
  
  /** References the element that labels the dialog */
  'aria-labelledby'?: string;
  
  /** References the element that describes the dialog */
  'aria-describedby'?: string;
  
  /** Role should typically be 'dialog' or 'alertdialog' */
  role?: 'dialog' | 'alertdialog';
}

/**
 * Helper type for components that can be either controlled or uncontrolled
 */
export type ControlledProps<T> = {
  /** Controlled value */
  value: T;
  /** Change handler for controlled component */
  onChange: (value: T) => void;
  /** Default value is not used in controlled mode */
  defaultValue?: never;
} | {
  /** Uncontrolled default value */
  defaultValue?: T;
  /** Change handler for uncontrolled component */
  onChange?: (value: T) => void;
  /** Value is not used in uncontrolled mode */
  value?: never;
};

/**
 * Screen reader only text component props
 */
export interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Live region props for dynamic content announcements
 */
export interface LiveRegionProps {
  /** The politeness level of the live region */
  'aria-live'?: 'off' | 'polite' | 'assertive';
  
  /** Indicates what types of changes should be announced */
  'aria-relevant'?: 'additions' | 'removals' | 'text' | 'all';
  
  /** Indicates whether the entire region should be announced */
  'aria-atomic'?: boolean;
}
