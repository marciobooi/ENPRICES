import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { site } from '../config/toolConfig'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { RoundButton } from './RoundButton'

const LANGUAGES = site.languages

export function LanguageSelector() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const language = i18n.resolvedLanguage ?? 'en'
  const languageName = LANGUAGES.find(({ code }) => code === language)?.name ?? LANGUAGES[0].name

  useFocusTrap(overlayRef, {
    active: open,
    onDeactivate: () => setOpen(false),
    initialFocus: '[aria-current="true"]',
    ignoreOutsideClick: [buttonRef],
  })

  // A real address (the same view in that language), so "open in new tab" and copying the link work; a plain click
  // switches the language without reloading.
  const languageHref = (code: string) => {
    const address = new URL(window.location.href)
    address.searchParams.set('language', code)
    address.hash = ''
    return `${address.pathname}${address.search.replace(/%2C/gi, ',')}`
  }

  const changeLanguage = (code: string) => {
    void i18n.changeLanguage(code)
    // The address follows the language, so a shared or bookmarked link opens in the language that was on screen.
    window.history.replaceState(window.history.state, '', languageHref(code))
    setOpen(false)
  }

  return (
    <div id="lang-section" className="masthead-language-section">
      <button
        ref={buttonRef}
        id="toggleLanguageBtn"
        className="masthead-language ecl-button ecl-button--secondary"
        type="button"
        aria-label={`${t('navigation.language')}: ${languageName}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? 'language-list-overlay' : undefined}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <span className="ecl-button__container">
          <span className="wt-icon-ecl--global ecl-button__icon" aria-hidden="true" />
          <span className="ecl-button__label" data-ecl-label="true">{languageName}</span>
        </span>
      </button>

      {open && (
        <div
          ref={overlayRef}
          id="language-list-overlay"
          className="ecl-site-header__language-container language-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="language-overlay-title"
        >
          <div className="ecl-site-header__language-header">
            <div className="ecl-site-header__language-title" id="language-overlay-title">
              {t('navigation.selectLanguage')}
            </div>
            <RoundButton
              icon="close"
              label={t('navigation.closeLanguageDialog')}
              tooltip={false}
              className="ecl-site-header__language-close popover-close"
              onClick={() => setOpen(false)}
            />
          </div>
          <div className="ecl-site-header__language-content ecl-site-header__language-content--stack">
            <div className="ecl-site-header__language-category ecl-site-header__language-category--3-col">
              <div className="ecl-site-header__language-category-title">{t('navigation.officialLanguages')}</div>
              <ul className="ecl-site-header__language-list">
                {LANGUAGES.map(({ code, name }) => {
                  const selected = language === code
                  return (
                    <li
                      key={code}
                      className={`ecl-site-header__language-item${selected ? ' ecl-site-header__language-link--active' : ''}`}
                    >
                      <a
                        href={languageHref(code)}
                        className="ecl-link ecl-link--standalone ecl-site-header__language-link"
                        lang={code}
                        aria-current={selected ? 'true' : undefined}
                        onClick={(event) => {
                          event.preventDefault()
                          changeLanguage(code)
                        }}
                      >
                        <span className="ecl-site-header__language-link-code">{code}</span>
                        <span className="ecl-site-header__language-link-label">{name}</span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
