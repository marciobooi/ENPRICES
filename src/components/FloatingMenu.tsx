import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGripVertical,
  faHashtag,
  faSortAlphaDown,
  faSortNumericDown,
  faSortNumericUp,
  faPercent,
  faGrip,
  faLayerGroup,
  faCogs,
  faEye
} from '@fortawesome/free-solid-svg-icons';
import { useQuery } from '../context/QueryContext';
import { Tooltip } from 'react-tooltip';

interface Position {
  x: number;
  y: number;
}

const FloatingMenu: React.FC = () => {
  const { t } = useTranslation();
  const { state, dispatch } = useQuery();
  const [position, setPosition] = useState<Position>({ x: window.innerWidth - 320, y: 220 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLButtonElement>(null);

  // Add hover styles
  const hoverStyles = `
    .floating-menu .ecl-button:hover:not(:disabled) {
      outline: 3px solid #ffd617 !important;
      border-color: transparent !important;
      background-color: var(--c-p-80) !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 2px 8px rgba(0, 68, 148, 0.3) !important;
      transition: all 0.2s ease !important;
    }
    
    .floating-menu .ecl-button.ecl-button--primary,
    .floating-menu .ecl-button[aria-pressed="true"] {
      background-color: #ffd617 !important;
      color: #004494 !important;
      border-color: #ffd617 !important;
      box-shadow: 0 0 0 0 !important;
      transform: translateY(0) !important;
    }
    
    .floating-menu .ecl-button {
      transition: all 0.2s ease !important;
    }
  `;

  // Insert styles into head
  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = hoverStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Handle mouse drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      setPosition({
        x: window.innerWidth - e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!menuRef.current) return;
    
    const rect = menuRef.current.getBoundingClientRect();
    setDragOffset({
      x: rect.right - e.clientX,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // For keyboard, start dragging from current position
      setDragOffset({ x: 0, y: 0 });
      setIsDragging(true);
    }
  };

  // Toggle decimals (1-4)
  const toggleDecimals = () => {
    const nextDecimals = state.decimals >= 4 ? 1 : state.decimals + 1;
    dispatch({ type: 'SET_DECIMALS', payload: nextDecimals });
  };

  // Toggle order through states: proto -> alfa -> asc -> desc
  const toggleOrder = () => {
    const orderCycle: Array<'proto' | 'alfa' | 'asc' | 'desc'> = ['proto', 'alfa', 'asc', 'desc'];
    const currentIndex = orderCycle.indexOf(state.order);
    const nextIndex = (currentIndex + 1) % orderCycle.length;
    dispatch({ type: 'SET_ORDER', payload: orderCycle[nextIndex] });
  };

  // Toggle percentage
  const togglePercentage = () => {
    dispatch({ type: 'SET_PERCENTAGE', payload: !state.percentage });
  };

  // Toggle aggregates (hide EU entities)
  const toggleAggregates = () => {
    dispatch({ type: 'SET_HIDE_AGGREGATES', payload: !state.hideAggregates });
  };

  // Toggle component (include price components)
  const toggleComponent = () => {
    dispatch({ type: 'SET_COMPONENT', payload: !state.component });
  };

  // Toggle details (detailed vs summary view)
  const toggleDetails = () => {
    dispatch({ type: 'SET_DETAILS', payload: !state.details });
  };

  // Get order icon based on current state
  const getOrderIcon = () => {
    switch (state.order) {
      case 'proto': return faGrip;
      case 'alfa': return faSortAlphaDown;
      case 'asc': return faSortNumericDown;
      case 'desc': return faSortNumericUp;
      default: return faGrip;
    }
  };

  // Get order label for accessibility
  const getOrderLabel = () => {
    switch (state.order) {
      case 'proto': return t('floatingMenu.order.proto', 'Protocol order');
      case 'alfa': return t('floatingMenu.order.alfabetical', 'Alphabetical order');
      case 'asc': return t('floatingMenu.order.ascending', 'Ascending order');
      case 'desc': return t('floatingMenu.order.descending', 'Descending order');
      default: return t('floatingMenu.order.proto', 'Protocol order');
    }
  };

  return (
    <>
      <div
        ref={menuRef}
        className="floating-menu"
        style={{
          position: 'fixed',
          right: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 0,
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          padding: '8px',
          display: 'flex',
          gap: '4px',
          border: '1px solid #e0e0e0'
        }}
        role="toolbar"
        aria-label={t('floatingMenu.label', 'Chart controls')}
      >
        {/* Drag Handle */}
        <button
          ref={dragHandleRef}
          className="ecl-button ecl-button--secondary"
          onMouseDown={handleMouseDown}
          onKeyDown={handleKeyDown}
          aria-label={t('floatingMenu.drag', 'Drag to move menu')}
          data-tooltip-id="drag-tooltip"
          data-tooltip-content={t('floatingMenu.drag', 'Drag to move menu')}
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            padding: '8px',
            borderRadius: '4px'
          }}
        >
          <FontAwesomeIcon icon={faGripVertical} />
        </button>

        {/* Decimals Button */}
        <button
          className={`ecl-button ecl-button--secondary floating-menu-btn`}
          onClick={toggleDecimals}
          aria-label={t('floatingMenu.decimals.label', { count: state.decimals })}
          data-tooltip-id="decimals-tooltip"
          data-tooltip-content={t('floatingMenu.decimals.tooltip', { count: state.decimals })}
          style={{
            padding: '8px',
            borderRadius: '4px',
            position: 'relative'
          }}
        >
          <FontAwesomeIcon icon={faHashtag} />
          <span style={{ 
            fontSize: '10px', 
            position: 'absolute', 
            bottom: '2px', 
            right: '2px',
            backgroundColor: '#007bff',
            color: 'white',
            borderRadius: '50%',
            width: '14px',
            height: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {state.decimals}
          </span>
        </button>

        {/* Order Button */}
        <button
          className="ecl-button ecl-button--secondary floating-menu-btn"
          onClick={toggleOrder}
          aria-label={getOrderLabel()}
          data-tooltip-id="order-tooltip"
          data-tooltip-content={getOrderLabel()}
          style={{
            padding: '8px',
            borderRadius: '4px'
          }}
        >
          <FontAwesomeIcon icon={getOrderIcon()} />
        </button>

        {/* Percentage Button - Only show in details mode */}
        {state.details && (
          <button
            className={`ecl-button ${state.percentage ? 'ecl-button--primary' : 'ecl-button--secondary'} floating-menu-btn`}
            onClick={togglePercentage}
            aria-label={t('floatingMenu.percentage.label', 'Toggle percentage view')}
            data-tooltip-id="percentage-tooltip"
            data-tooltip-content={t('floatingMenu.percentage.tooltip', { status: state.percentage ? 'on' : 'off' })}
            aria-pressed={state.percentage}
            style={{
              padding: '8px',
              borderRadius: '4px'
            }}
          >
            <FontAwesomeIcon icon={faPercent} />
          </button>
        )}

        {/* Hide Aggregates Button */}
        <button
          className={`ecl-button ${state.hideAggregates ? 'ecl-button--primary' : 'ecl-button--secondary'} floating-menu-btn`}
          onClick={toggleAggregates}
          aria-label={t('floatingMenu.aggregates.label', 'Toggle aggregates visibility')}
          data-tooltip-id="aggregates-tooltip"
          data-tooltip-content={t('floatingMenu.aggregates.tooltip', { status: state.hideAggregates ? 'hidden' : 'visible' })}
          aria-pressed={state.hideAggregates}
          style={{
            padding: '8px',
            borderRadius: '4px'
          }}
        >
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <FontAwesomeIcon icon={faLayerGroup} />
            {state.hideAggregates && (
              <span 
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '18px',
                  color: 'white',
                  fontWeight: 'bold',
                  textShadow: '0 0 2px rgba(0,0,0,0.8)'
                }}
              >
                /
              </span>
            )}
          </div>
        </button>

        {/* Component Button */}
        <button
          className={`ecl-button ${state.component ? 'ecl-button--primary' : 'ecl-button--secondary'} floating-menu-btn`}
          onClick={toggleComponent}
          aria-label={t('floatingMenu.component.label', 'Toggle price components')}
          data-tooltip-id="component-tooltip"
          data-tooltip-content={t('floatingMenu.component.tooltip', { status: state.component ? 'included' : 'excluded' })}
          aria-pressed={state.component}
          style={{
            padding: '8px',
            borderRadius: '4px'
          }}
        >
          <FontAwesomeIcon icon={faCogs} />
        </button>

        {/* Details Button */}
        <button
          className={`ecl-button ${state.details ? 'ecl-button--primary' : 'ecl-button--secondary'} floating-menu-btn`}
          onClick={toggleDetails}
          aria-label={t('floatingMenu.details.label', 'Toggle detailed view')}
          data-tooltip-id="details-tooltip"
          data-tooltip-content={t('floatingMenu.details.tooltip', { status: state.details ? 'detailed' : 'summary' })}
          aria-pressed={state.details}
          style={{
            padding: '8px',
            borderRadius: '4px'
          }}
        >
          <FontAwesomeIcon icon={faEye} />
        </button>
      </div>

      {/* Tooltips */}
      <Tooltip id="drag-tooltip" place="bottom" delayShow={500} />
      <Tooltip id="decimals-tooltip" place="bottom" delayShow={500} />
      <Tooltip id="order-tooltip" place="bottom" delayShow={500} />
      <Tooltip id="percentage-tooltip" place="bottom" delayShow={500} />
      <Tooltip id="aggregates-tooltip" place="bottom" delayShow={500} />
      <Tooltip id="component-tooltip" place="bottom" delayShow={500} />
      <Tooltip id="details-tooltip" place="bottom" delayShow={500} />

      {/* Screen Reader Announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isDragging && t('floatingMenu.screenReader.dragging', 'Moving chart controls menu')}
      </div>
    </>
  );
};

export default FloatingMenu;