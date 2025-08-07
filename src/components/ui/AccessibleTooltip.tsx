import React from 'react';
import { Tooltip } from 'react-tooltip';
import { useTranslation } from 'react-i18next';

interface AccessibleTooltipProps {
  id: string;
  translationKey: string;
  children: React.ReactElement;
  place?: 'top' | 'bottom' | 'left' | 'right';
}

const AccessibleTooltip: React.FC<AccessibleTooltipProps> = ({
  id,
  translationKey,
  children,
  place = 'top'
}) => {
  const { t } = useTranslation();
  const tooltipText = t(translationKey);

  // Clone child and add tooltip data attributes
  const childWithTooltip = React.cloneElement(children, {
    ...(children.props as any),
    'data-tooltip-id': id,
    'data-tooltip-content': tooltipText,
    'data-tooltip-place': place,
  } as any);

  return (
    <>
      {childWithTooltip}
      <Tooltip
        id={id}
        place={place}
        style={{
          backgroundColor: '#333',
          color: '#fff',
          borderRadius: '4px',
          padding: '8px 12px',
          fontSize: '14px',
          maxWidth: '250px',
          zIndex: 9999,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          border: '1px solid #666'
        }}
        opacity={1}
      />
    </>
  );
};

export default AccessibleTooltip;
