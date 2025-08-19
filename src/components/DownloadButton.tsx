import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip } from 'react-tooltip';
import { RoundBtn } from './ui/index';
import { exportChart, type ChartExportOptions } from '../services/chartExport';

interface DownloadButtonProps {
  className?: string;
  format?: 'png' | 'jpeg' | 'pdf' | 'svg' | 'csv' | 'xls';
  filename?: string;
  tooltipText?: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ 
  className = '', 
  format = 'png',
  filename,
  tooltipText
}) => {
  const { t } = useTranslation();

  const handleDownload = () => {
    const exportOptions: ChartExportOptions = {
      format,
      filename: filename || `energy-prices-${format}-${new Date().toISOString().split('T')[0]}`
    };

    try {
      exportChart(exportOptions);
      console.log(`Chart exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const defaultTooltip = tooltipText || t('tooltips.download', `Download chart as ${format.toUpperCase()}`);

  return (
    <div className={`download-button-container ${className}`}>
      <RoundBtn
        id="download-button"
        className="download-button"
        onClick={handleDownload}
        ariaLabel={t('ui.download.button', 'Download chart')}
        variant="ghost"
        size="medium"
        icon="fa-download"
        iconOnly={true}
        data-tooltip-id="download-tooltip"
        data-tooltip-content={defaultTooltip}
        data-tooltip-place="bottom"
      />
      <Tooltip
        id="download-tooltip"
        place="bottom"
        delayShow={200}
        delayHide={100}
        noArrow={true}
      />
    </div>
  );
};

export default DownloadButton;
