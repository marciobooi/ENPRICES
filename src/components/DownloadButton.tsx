import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip } from 'react-tooltip';
import { RoundBtn } from './ui/index';

interface DownloadButtonProps {
  className?: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ className = '' }) => {
  const { t } = useTranslation();

  const handleDownload = () => {
    // TODO: Implement download functionality
    console.log('Download button clicked');
  };

  return (
    <div className={`download-button-container ${className}`}>
      <RoundBtn
        id="download-button"
        className="download-button"
        onClick={handleDownload}
        ariaLabel={t('ui.download.button', 'Download data')}
        variant="ghost"
        size="medium"
        icon="fa-download"
        iconOnly={true}
        data-tooltip-id="download-tooltip"
        data-tooltip-content={t('tooltips.download', 'Download data')}
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
