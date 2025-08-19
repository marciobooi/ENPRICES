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
  faEyeSlash
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
  const [position, setPosition] = useState<Position>({ x: 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLButtonElement>(null);

  // Handle mouse drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      setPosition({
        x: e.clientX - dragOffset.x,
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
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleMouseDown(e as any);
    }
  };

  // Toggle decimals (0-3)
  const toggleDecimals = () => {
    const nextDecimals = (state.decimals + 1) % 4;
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
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 1000,
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
          className="drag-handle"
          onMouseDown={handleMouseDown}
          onKeyDown={handleKeyDown}
          aria-label={t('floatingMenu.drag', 'Drag to move menu')}
          data-tooltip-id="drag-tooltip"
          data-tooltip-content={t('floatingMenu.drag', 'Drag to move menu')}
          style={{
            background: 'none',
            border: 'none',
            cursor: isDragging ? 'grabbing' : 'grab',
            padding: '8px',
            color: '#666',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FontAwesomeIcon icon={faGripVertical} />
        </button>

        {/* Decimals Button */}
        <button
          className="floating-menu-btn"
          onClick={toggleDecimals}
          aria-label={t('floatingMenu.decimals.label', { count: state.decimals })}
          data-tooltip-id="decimals-tooltip"
          data-tooltip-content={t('floatingMenu.decimals.tooltip', { count: state.decimals })}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            color: '#333',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
          className="floating-menu-btn"
          onClick={toggleOrder}
          aria-label={getOrderLabel()}
          data-tooltip-id="order-tooltip"
          data-tooltip-content={getOrderLabel()}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            color: '#333',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FontAwesomeIcon icon={getOrderIcon()} />
        </button>

        {/* Percentage Button - Only show in details mode */}
        {state.details && (
          <button
            className="floating-menu-btn"
            onClick={togglePercentage}
            aria-label={t('floatingMenu.percentage.label', 'Toggle percentage view')}
            data-tooltip-id="percentage-tooltip"
            data-tooltip-content={t('floatingMenu.percentage.tooltip', { status: state.percentage ? 'on' : 'off' })}
            style={{
              background: state.percentage ? '#007bff' : 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              color: state.percentage ? 'white' : '#333',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FontAwesomeIcon icon={faPercent} />
          </button>
        )}

        {/* Hide Aggregates Button */}
        <button
          className="floating-menu-btn"
          onClick={toggleAggregates}
          aria-label={t('floatingMenu.aggregates.label', 'Toggle aggregates visibility')}
          data-tooltip-id="aggregates-tooltip"
          data-tooltip-content={t('floatingMenu.aggregates.tooltip', { status: state.hideAggregates ? 'hidden' : 'visible' })}
          style={{
            background: state.hideAggregates ? '#007bff' : 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            color: state.hideAggregates ? 'white' : '#333',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FontAwesomeIcon icon={faEyeSlash} />
        </button>
      </div>

      {/* Tooltips */}
      <Tooltip id="drag-tooltip" place="bottom" delayShow={500} />
      <Tooltip id="decimals-tooltip" place="bottom" delayShow={500} />
      <Tooltip id="order-tooltip" place="bottom" delayShow={500} />
      <Tooltip id="percentage-tooltip" place="bottom" delayShow={500} />
      <Tooltip id="aggregates-tooltip" place="bottom" delayShow={500} />

      {/* Screen Reader Announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isDragging && t('floatingMenu.screenReader.dragging', 'Moving chart controls menu')}
      </div>
    </>
  );
};

export default FloatingMenu;