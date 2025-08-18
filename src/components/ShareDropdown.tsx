import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RoundBtn } from './ui';
import { Tooltip } from 'react-tooltip';

interface ShareDropdownProps { className?: string }

const ShareDropdown: React.FC<ShareDropdownProps> = ({ className = '' }) => {
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

  const share = (platform: 'facebook' | 'twitter' | 'linkedin') => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title || 'Energy Prices Chart');
    let href = '';
    if (platform === 'facebook') href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    if (platform === 'twitter') href = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
    if (platform === 'linkedin') href = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    if (href) window.open(href, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
    setOpen(false);
  };

  const onItemClick = (e: React.MouseEvent<HTMLAnchorElement>, p: 'facebook' | 'twitter' | 'linkedin') => {
    e.preventDefault();
    share(p);
  };

  const buttonId = 'share-dropdown-button';
  const menuId = 'share-dropdown-menu';

  return (
    <div className={`info-dropdown share-dropdown ${className}`} ref={rootRef}>
      <RoundBtn
        ref={btnRef}
        id={buttonId}
        icon="fa-share-alt"
        onClick={toggle}
        ariaLabel={t('ui.share.button', 'Share chart')}
        ariaExpanded={open}
        ariaControls={menuId}
        aria-haspopup="menu"
        variant="secondary"
        size="medium"
        className="info-dropdown-button"
        data-tooltip-id="share-button-tooltip"
        data-tooltip-content={t('tooltips.share', 'Share this chart')}
      />

      <Tooltip 
        id="share-button-tooltip" 
        place="bottom" 
        delayShow={200} 
        delayHide={100} 
        noArrow={true}
        border="2px solid #004494"
        style={{ backgroundColor: 'rgba(255,255,255,0.95)', color: '#000', borderRadius: 4, padding: '8px 12px', fontSize: 14, fontWeight: 500, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 9999, maxWidth: 250 }}
      />

      {/* SR live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {open ? t('ui.share.dropdown.title', 'Share Chart') : ''}
      </div>

      {open && (
        <div id={menuId} className="info-dropdown-menu" role="menu" aria-labelledby={buttonId}>
          <ul className="info-dropdown-list" role="none">
            <li role="none">
              <a href="#facebook" role="menuitem" className="info-dropdown-link"
                 onClick={(e) => onItemClick(e, 'facebook')}
                 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onItemClick(e as any, 'facebook'); } }}
                 tabIndex={0} aria-describedby="facebook-description">
                <i className="fab fa-facebook-f" aria-hidden="true"></i>
                <span>{t('ui.share.dropdown.facebook.button', 'Share on Facebook')}</span>
                <span id="facebook-description" className="sr-only">{t('ui.share.dropdown.facebook.label', 'Share this chart on Facebook')}</span>
              </a>
            </li>
            <li role="none">
              <a href="#twitter" role="menuitem" className="info-dropdown-link"
                 onClick={(e) => onItemClick(e, 'twitter')}
                 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onItemClick(e as any, 'twitter'); } }}
                 tabIndex={0} aria-describedby="twitter-description">
                <i className="fab fa-x-twitter" aria-hidden="true"></i>
                <span>{t('ui.share.dropdown.twitter.button', 'Share on X (Twitter)')}</span>
                <span id="twitter-description" className="sr-only">{t('ui.share.dropdown.twitter.label', 'Share this chart on X (formerly Twitter)')}</span>
              </a>
            </li>
            <li role="none">
              <a href="#linkedin" role="menuitem" className="info-dropdown-link"
                 onClick={(e) => onItemClick(e, 'linkedin')}
                 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onItemClick(e as any, 'linkedin'); } }}
                 tabIndex={0} aria-describedby="linkedin-description">
                <i className="fab fa-linkedin-in" aria-hidden="true"></i>
                <span>{t('ui.share.dropdown.linkedin.button', 'Share on LinkedIn')}</span>
                <span id="linkedin-description" className="sr-only">{t('ui.share.dropdown.linkedin.label', 'Share this chart on LinkedIn')}</span>
              </a>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ShareDropdown;
