import React, { useState } from 'react';
import { FocusTrap } from 'focus-trap-react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
];

const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(() => {
    const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];
    return current;
  });

  return (
    <div id="lang-section">
      <button
        id="toggleLanguageBtn"
        type="button"
        className="ecl-button ecl-button--secondary"
        aria-expanded={open}
        aria-label={t('nav.language.current', { lang: t(`nav.language.${selected.code}`) })}
        onClick={() => setOpen(!open)}
      >
        <i className="fas fa-globe" aria-hidden="true"></i>
        <span id="lang-selection-text" className="btn-text">{t(`nav.language.${selected.code}`)}</span>
      </button>
      {open && (
        <FocusTrap
          active={open}
          focusTrapOptions={{
            initialFocus: false,
            allowOutsideClick: true,
            clickOutsideDeactivates: true,
            setReturnFocus: '#toggleLanguageBtn',
            escapeDeactivates: true,
            onDeactivate: () => setOpen(false)
          }}
        >
          <div
            className="ecl-site-header__language-container visible"
            id="language-list-overlay"
            data-ecl-language-list-overlay=""
            aria-labelledby="ecl-site-header__language-title"
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
          >
          <div className="ecl-site-header__language-header">
            <div className="ecl-site-header__language-title" id="ecl-site-header__language-title">
              {t('nav.language.select_label')}
            </div>
            <button
              id="languageClsBtn"
              className="ecl-button ecl-button--ghost ecl-site-header__language-close"
              type="button"
              data-ecl-language-list-close=""
              tabIndex={0}
              aria-label="Close"
              onClick={() => setOpen(false)}
            >
              <span className="ecl-button__container">
              <span className="ecl-u-sr-only">{t('nav.language.close')}</span>
                <i className="fas fa-times-circle ecl-icon ecl-button__icon ecl-button__icon--after" aria-hidden="true"></i>
              </span>
            </button>
          </div>
          <div className="ecl-site-header__language-content ecl-site-header__language-content--stack">
            <div className="ecl-site-header__language-category ecl-site-header__language-category--3-col">
              <div className="ecl-site-header__language-category-title">{t('nav.language.official')}</div>
              <ul className="ecl-site-header__language-list">
                {LANGUAGES.map(lang => (
                  <li
                    key={lang.code}
                    className={`ecl-site-header__language-item${selected.code === lang.code ? ' ecl-site-header__language-link--active' : ''}`}
                    id={lang.code.toUpperCase()}
                    data-lang={lang.code.toUpperCase()}
                  >
                    <a
                      href="#"
                      className="ecl-link ecl-link--standalone ecl-site-header__language-link"
                      lang={`${lang.code}-${lang.code.toUpperCase()}`}
                      tabIndex={0}
                      aria-current={selected.code === lang.code ? 'true' : undefined}
                      aria-label={t('nav.language.current', { lang: t(`nav.language.${lang.code}`) })}
                      onClick={e => {
                        e.preventDefault();
                        setSelected(lang);
                        i18n.changeLanguage(lang.code);
                        setOpen(false);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelected(lang);
                          i18n.changeLanguage(lang.code);
                          setOpen(false);
                        }
                      }}
                    >
                      <span className="ecl-site-header__language-link-code">{lang.code}</span>
                      <span className="ecl-site-header__language-link-label">{t(`nav.language.${lang.code}`)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          </div>
        </FocusTrap>
      )}
    </div>
  );
};

export default LanguageSelector;
