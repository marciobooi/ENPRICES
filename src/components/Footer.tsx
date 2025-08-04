import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const footerRef = useRef<HTMLElement>(null);

  const footerLinks = [
    {
      id: 'footer-legal',
      href: 'https://ec.europa.eu/info/legal-notice_en',
      translationKey: 'footer.LEGAL',
      defaultText: 'Legal notice',
      description: 'View the legal notice and terms of use for this website'
    },
    {
      id: 'footer-privacy',
      href: 'https://ec.europa.eu/info/privacy-policy_en',
      translationKey: 'footer.PRIVACY',
      defaultText: 'Privacy policy',
      description: 'Read about how we collect and use your personal data'
    },
    {
      id: 'footer-cookies',
      href: 'https://ec.europa.eu/info/cookies_en',
      translationKey: 'footer.COOKIES',
      defaultText: 'Cookies policy',
      description: 'Learn about our use of cookies and tracking technologies'
    },
    {
      id: 'footer-access',
      href: 'https://ec.europa.eu/eurostat/web/main/help/accessibility',
      translationKey: 'footer.ACCESS',
      defaultText: 'Accessibility',
      description: 'Information about accessibility features and support'
    }
  ];

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent<HTMLAnchorElement>, index: number) => {
    const links = footerRef.current?.querySelectorAll('.ecl-site-footer__link') as NodeListOf<HTMLAnchorElement>;
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        const prevIndex = index > 0 ? index - 1 : links.length - 1;
        links[prevIndex]?.focus();
        break;
      case 'ArrowRight':
        event.preventDefault();
        const nextIndex = index < links.length - 1 ? index + 1 : 0;
        links[nextIndex]?.focus();
        break;
      case 'Home':
        event.preventDefault();
        links[0]?.focus();
        break;
      case 'End':
        event.preventDefault();
        links[links.length - 1]?.focus();
        break;
    }
  };

  // Handle skip link click
  const handleSkipLinkClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer 
      ref={footerRef}
      role="contentinfo" 
      aria-label={t('footer.FOOTER_ARIA_LABEL', 'Site footer')}
      tabIndex={-1}
      id="site-footer"
    >
      {/* Skip link for keyboard users */}
      <a 
        href="#main-content" 
        className="ecl-site-footer__skip-link"
        aria-label={t('footer.SKIP_TO_MAIN', 'Skip to main content')}
        onClick={handleSkipLinkClick}
      >
        {t('footer.SKIP_TO_MAIN', 'Skip to main content')}
      </a>
      
      <div className="ecl-site-footer">
        <div className="ecl-container">
          <nav 
            aria-label={t('footer.FOOTER_NAV_ARIA_LABEL', 'Footer navigation')}
            role="navigation"
          >
            <ul 
              id="footerCredits" 
              className="ecl-site-footer__list"
              role="list"
              aria-label={t('footer.FOOTER_LINKS_LABEL', 'Footer links')}
            >
              {footerLinks.map((link, index) => (
                <li key={link.id} className="ecl-site-footer__list-item" role="listitem">
                  <a
                    id={link.id}
                    href={link.href}
                    data-i18n={link.translationKey}
                    className="ecl-link ecl-link--standalone ecl-site-footer__link"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-describedby="external-link-notice"
                    aria-label={`${t(link.translationKey, link.defaultText)} ${t('footer.EXTERNAL_LINK_NOTICE', '(opens in a new tab)')}`}
                    title={t(`footer.${link.translationKey.split('.')[1]}_DESC`, link.description)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                  >
                    {t(link.translationKey, link.defaultText)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Screen reader notices */}
          <div className="ecl-u-sr-only">
            <div 
              id="external-link-notice" 
              aria-hidden="true"
            >
              {t('footer.EXTERNAL_LINK_NOTICE', '(opens in a new tab)')}
            </div>
            <div 
              id="keyboard-navigation-help"
              aria-hidden="true"
            >
              {t('footer.KEYBOARD_NAV_HELP', 'Use arrow keys to navigate between footer links, Home and End keys to jump to first or last link')}
            </div>
          </div>
          
          {/* Live region for dynamic announcements */}
          <div 
            id="footer-announcements"
            aria-live="polite"
            aria-atomic="true"
            className="ecl-u-sr-only"
          />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
