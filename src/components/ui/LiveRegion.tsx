import React from 'react';
import type { LiveRegionProps } from './types/accessibility';

interface LiveRegionComponentProps extends LiveRegionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

/**
 * Live region component for announcing dynamic content changes to screen readers
 * Use for status updates, error messages, or other important notifications
 */
const LiveRegion: React.FC<LiveRegionComponentProps> = ({
  children,
  className = '',
  id,
  'aria-live': ariaLive = 'polite',
  'aria-relevant': ariaRelevant = 'additions text',
  'aria-atomic': ariaAtomic = false
}) => {
  return (
    <div
      id={id}
      className={`live-region ${className}`}
      aria-live={ariaLive}
      aria-relevant={ariaRelevant as any}
      aria-atomic={ariaAtomic}
      style={{
        position: 'absolute',
        left: '-10000px',
        width: '1px',
        height: '1px',
        overflow: 'hidden'
      }}
    >
      {children}
    </div>
  );
};

/**
 * Assertive live region for urgent announcements
 * Will interrupt screen reader output
 */
export const AssertiveLiveRegion: React.FC<Omit<LiveRegionComponentProps, 'aria-live'>> = (props) => (
  <LiveRegion {...props} aria-live="assertive" />
);

/**
 * Polite live region for non-urgent announcements
 * Will wait for screen reader to finish current output
 */
export const PoliteLiveRegion: React.FC<Omit<LiveRegionComponentProps, 'aria-live'>> = (props) => (
  <LiveRegion {...props} aria-live="polite" />
);

export default LiveRegion;
