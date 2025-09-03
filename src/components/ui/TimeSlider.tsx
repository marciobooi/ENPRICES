import React, { useMemo, useCallback } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { useTranslation } from 'react-i18next';

interface TimeSliderProps {
  /**
   * Array of available time periods (e.g., ["2020-S1", "2020-S2", "2021-S1", ...])
   */
  timeOptions: string[];
  
  /**
   * Currently selected time period
   */
  selectedTime: string;
  
  /**
   * Callback when time period changes
   */
  onChange: (time: string) => void;
  
  /**
   * Optional ID for the component
   */
  id?: string;
  
  /**
   * Optional CSS class name
   */
  className?: string;
  
  /**
   * Whether the slider is disabled
   */
  disabled?: boolean;
}

/**
 * TimeSlider component with full accessibility support
 * Provides keyboard navigation, screen reader support, and visual indicators
 */
export const TimeSlider: React.FC<TimeSliderProps> = ({
  timeOptions,
  selectedTime,
  onChange,
  id = 'time-slider',
  className = '',
  disabled = false
}) => {
  const { t } = useTranslation();

  // Create mapping between slider values (0-based index) and time periods
  // Sort timeOptions from lowest to highest
  const sortedTimeOptions = useMemo(() => {
    return [...timeOptions].sort((a, b) => {
      // Extract year from time period (e.g., "2021-S1" -> 2021)
      const yearA = parseInt(a.split('-')[0]);
      const yearB = parseInt(b.split('-')[0]);
      if (yearA !== yearB) return yearA - yearB;
      
      // If same year, sort by semester/quarter
      if (a.includes('-S') && b.includes('-S')) {
        const semesterA = parseInt(a.split('-S')[1]);
        const semesterB = parseInt(b.split('-S')[1]);
        return semesterA - semesterB;
      }
      
      return a.localeCompare(b);
    });
  }, [timeOptions]);

  const { timeIndex, indexToTime } = useMemo(() => {
    const timeToIndex = new Map<string, number>();
    const indexToTime = new Map<number, string>();
    
    sortedTimeOptions.forEach((time, index) => {
      timeToIndex.set(time, index);
      indexToTime.set(index, time);
    });
    
    return {
      timeIndex: timeToIndex.get(selectedTime) ?? 0,
      indexToTime
    };
  }, [sortedTimeOptions, selectedTime]);

  // Format time period for display (e.g., "2021-S1" -> "2021 S1")
  const formatTimeForDisplay = useCallback((time: string): string => {
    if (time.includes('-S')) {
      const [year, semester] = time.split('-S');
      return `${year} S${semester}`;
    }
    if (time.includes('Q')) {
      // Handle quarterly data (e.g., "2021Q1" -> "2021 Q1")
      return time.replace(/(\d{4})Q(\d)/, '$1 Q$2');
    }
    // Handle annual data or other formats
    return time;
  }, []);

  // Handle slider change
  const handleSliderChange = useCallback((value: number | number[]) => {
    if (typeof value === 'number') {
      const newTime = indexToTime.get(value);
      if (newTime && newTime !== selectedTime) {
        onChange(newTime);
      }
    }
  }, [indexToTime, selectedTime, onChange]);

  // Create marks for the slider (show only years and specific semesters to avoid overcrowding)
  const marks = useMemo(() => {
    const marks: Record<number, React.ReactNode> = {};
    
    sortedTimeOptions.forEach((time, index) => {
      // Show marks for:
      // 1. First item
      // 2. Last item  
      // 3. S2 (second semester) of every 2-3 years to avoid overcrowding
      const isFirst = index === 0;
      const isLast = index === sortedTimeOptions.length - 1;
      const isS2 = time.includes('-S2');
      const year = parseInt(time.split('-')[0]);
      const showYearMark = isS2 && (year % 2 === 0); // Show every even year's S2
      
      if (isFirst || isLast || showYearMark) {
        marks[index] = (
          <span 
            style={{ 
              fontSize: '11px', 
              color: '#495057',
              whiteSpace: 'nowrap',
              transform: 'translateX(-50%)',
              fontWeight: '500'
            }}
          >
            {formatTimeForDisplay(time)}
          </span>
        );
      }
    });
    
    return marks;
  }, [sortedTimeOptions, formatTimeForDisplay]);

  if (sortedTimeOptions.length === 0) {
    // Show a placeholder when no time options are available
    return (
      <div className={`time-slider-loading ${className}`} style={{ margin: '20px 0' }}>
        <label className="ecl-form-label" style={{ marginBottom: '10px', display: 'block' }}>
          {t('timeSlider.label', 'Time Period')}
        </label>
        <div 
          style={{ 
            textAlign: 'center', 
            padding: '16px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            color: '#6c757d'
          }}
        >
          {t('timeSlider.loading', 'Loading time periods...')}
        </div>
      </div>
    );
  }

  if (sortedTimeOptions.length === 1) {
    // If only one time period, show as text instead of slider
    return (
      <div className={`time-slider-single ${className}`}>
        <label htmlFor={`${id}-display`} className="ecl-form-label">
          {t('timeSlider.label', 'Time Period')}
        </label>
        <div 
          id={`${id}-display`}
          className="ecl-text-input"
          style={{ 
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            padding: '8px 12px',
            borderRadius: '4px',
            textAlign: 'center'
          }}
          role="textbox"
          aria-readonly="true"
        >
          {formatTimeForDisplay(selectedTime)}
        </div>
      </div>
    );
  }

  return (
    <div className={`time-slider-container ${className}`} style={{ margin: '20px 0' }}>
      {/* Label for screen readers */}
      <label htmlFor={id} className="ecl-form-label" style={{ marginBottom: '10px', display: 'block' }}>
        {t('timeSlider.label', 'Time Period')}
      </label>
      
      {/* Current value display */}
      <div 
        id={`${id}-value`}
        style={{ 
          textAlign: 'center', 
          marginBottom: '15px', 
          fontSize: '16px', 
          fontWeight: 'bold',
          padding: '8px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px'
        }}
        aria-live="polite"
        aria-atomic="true"
      >
        {formatTimeForDisplay(selectedTime)}
      </div>
      
      {/* Slider component */}
      <div style={{ margin: '0 20px', position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <Slider
            id={id}
            min={0}
            max={sortedTimeOptions.length - 1}
            value={timeIndex}
            onChange={handleSliderChange}
            marks={marks}
            disabled={disabled}
            included={true}
            aria-label={t('timeSlider.ariaLabel', 'Select time period')}
            aria-describedby={`${id}-description`}
            aria-valuetext={formatTimeForDisplay(selectedTime)}
            tabIndex={0}
            style={{
              marginBottom: '40px'
            }}
            trackStyle={{
              backgroundColor: '#0073e6',
              height: 6
            }}
            railStyle={{
              backgroundColor: '#e1e8f0',
              height: 6
            }}
            handleStyle={{
              backgroundColor: '#ffffff',
              borderColor: '#0073e6',
              borderWidth: 3,
              height: 32,
              width: 32,
              marginTop: -13,
              boxShadow: '0 3px 12px rgba(0,115,230,0.4)',
              cursor: disabled ? 'not-allowed' : 'grab',
              borderRadius: '50%',
              borderStyle: 'solid',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 'bold',
              color: '#0073e6',
              position: 'relative'
            }}
            dotStyle={{
              backgroundColor: '#b8c5d1',
              borderColor: '#b8c5d1',
              height: 6,
              width: 6,
              marginTop: 0
            }}
            activeDotStyle={{
              backgroundColor: '#0073e6',
              borderColor: '#0073e6'
            }}
          />
          
          {/* Custom handle overlay with semester */}
          <div
            style={{
              position: 'absolute',
              left: `calc(${(timeIndex / Math.max(1, sortedTimeOptions.length - 1)) * 100}%)`,
              top: '-13px',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
              fontSize: '9px',
              fontWeight: 'bold',
              color: '#0073e6',
              zIndex: 10,
              textAlign: 'center',
              lineHeight: '1.1',
              width: '32px',
              height: '32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div>{selectedTime.split('-')[0]}</div>
            <div style={{ fontSize: '8px' }}>{selectedTime.includes('-S') ? selectedTime.split('-')[1] : ''}</div>
          </div>
        </div>
      </div>
      
      {/* Instructions for screen readers */}
      <div 
        id={`${id}-description`} 
        className="sr-only"
        aria-hidden="true"
      >
        {t('timeSlider.instructions', 'Use arrow keys to navigate between time periods. Press Enter to select.')}
      </div>
      
      {/* Range information for screen readers */}
      <div className="sr-only" aria-live="polite">
        {t('timeSlider.range', 'Available time periods from {{start}} to {{end}}', {
          start: formatTimeForDisplay(timeOptions[0]),
          end: formatTimeForDisplay(timeOptions[timeOptions.length - 1])
        })}
      </div>
    </div>
  );
};

export default TimeSlider;
