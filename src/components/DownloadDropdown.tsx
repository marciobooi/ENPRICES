import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RoundBtn } from './ui';
import { Tooltip } from 'react-tooltip';

interface DownloadDropdownProps { className?: string }

const DownloadDropdown: React.FC<DownloadDropdownProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      const items = rootRef.current?.querySelectorAll('[role="menuitem"]');
      if (!items || !items.length) return;
      const i = Array.from(items).findIndex(el => el === document.activeElement);
      switch (e.key) {
        case 'Escape': e.preventDefault(); setOpen(false); btnRef.current?.focus(); break;
        case 'ArrowDown': e.preventDefault(); (items[(i < items.length - 1 ? i + 1 : 0)] as HTMLElement).focus(); break;
        case 'ArrowUp': e.preventDefault(); (items[(i > 0 ? i - 1 : items.length - 1)] as HTMLElement).focus(); break;
        case 'Home': e.preventDefault(); (items[0] as HTMLElement).focus(); break;
        case 'End': e.preventDefault(); (items[items.length - 1] as HTMLElement).focus(); break;
      }
    };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const toggle = () => {
    setOpen(v => !v);
    if (!open) setTimeout(() => {
      const first = rootRef.current?.querySelector('[role="menuitem"]') as HTMLElement | null;
      first?.focus();
    }, 100);
  };

  // Placeholder handlers; wire to export logic later
  const onPng = (e?: React.MouseEvent) => { e?.preventDefault(); setOpen(false); console.log('Download PNG'); };
  const onJpeg = (e?: React.MouseEvent) => { e?.preventDefault(); setOpen(false); console.log('Download JPEG'); };
  const onExcel = (e?: React.MouseEvent) => { e?.preventDefault(); setOpen(false); console.log('Download Excel'); };

  const buttonId = 'download-dropdown-button';
  const menuId = 'download-dropdown-menu';

  return (
    <div className={`info-dropdown ${className}`} ref={rootRef}>
      <RoundBtn
        ref={btnRef}
        id={buttonId}
        icon="fa-download"
        onClick={toggle}
        ariaLabel={t('ui.download.button', 'Download data')}
        ariaExpanded={open}
        ariaControls={menuId}
        ariaHaspopup="menu"
        variant="ghost"
        size="medium"
        className="info-dropdown-button"
        data-tooltip-id="download-tooltip"
        data-tooltip-content={t('tooltips.download', 'Download data')}
        data-tooltip-place="bottom"
      />
      <Tooltip id="download-tooltip" place="bottom" delayShow={200} delayHide={100} noArrow={true} />

      {open && (
        <div id={menuId} className="info-dropdown-menu" role="menu" aria-labelledby={buttonId}>
          <ul className="info-dropdown-list" role="none">
            <li role="none">
              <a href="#png" role="menuitem" className="info-dropdown-link" tabIndex={0}
                 onClick={onPng}
                 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPng(e as any); } }}
                 aria-describedby="download-png-desc">
                <i className="fa fa-file-image" aria-hidden="true"></i>
                <span>{t('ui.download.dropdown.png.button', 'PNG image')}</span>
                <span id="download-png-desc" className="sr-only">{t('ui.download.dropdown.png.label', 'Download PNG image')}</span>
              </a>
            </li>
            <li role="none">
              <a href="#jpeg" role="menuitem" className="info-dropdown-link" tabIndex={0}
                 onClick={onJpeg}
                 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onJpeg(e as any); } }}
                 aria-describedby="download-jpeg-desc">
                <i className="fa fa-image" aria-hidden="true"></i>
                <span>{t('ui.download.dropdown.jpeg.button', 'JPEG image')}</span>
                <span id="download-jpeg-desc" className="sr-only">{t('ui.download.dropdown.jpeg.label', 'Download JPEG image')}</span>
              </a>
            </li>
            <li role="none">
              <a href="#excel" role="menuitem" className="info-dropdown-link" tabIndex={0}
                 onClick={onExcel}
                 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onExcel(e as any); } }}
                 aria-describedby="download-excel-desc">
                <i className="fa fa-file-excel" aria-hidden="true"></i>
                <span>{t('ui.download.dropdown.excel.button', 'Excel file')}</span>
                <span id="download-excel-desc" className="sr-only">{t('ui.download.dropdown.excel.label', 'Download Excel file')}</span>
              </a>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default DownloadDropdown;
