import { useTranslation } from 'react-i18next'
import { accessibilityHref } from '../accessibility/mode'
import { localizedLink, site } from '../config/toolConfig'
import { useNeedsScroll } from '../hooks/useNeedsScroll'
import { RoundButton } from './RoundButton'

export function SiteFooter() {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  // The shortcut only makes sense when the page actually scrolls (tool view and accessibility statement alike).
  const needsScroll = useNeedsScroll()

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        {needsScroll && (
          <RoundButton
            href="#top"
            icon="arrow-up"
            variant="primary"
            label={t('footer.backToTop')}
            onClick={(event) => {
              // Scroll up without adding "#top" to the address and the history; keyboard focus goes to the top of the
              // page too (not left at the footer), so the next Tab starts from there. The scroll itself is smooth
              // unless the person asked for reduced motion (src/index.css).
              event.preventDefault()
              window.scrollTo({ top: 0 })
              document.getElementById('top')?.focus({ preventScroll: true })
            }}
          />
        )}
        <nav aria-label={t('footer.label')}>
          <a className="ecl-link" href={localizedLink(site.links.footer.privacy, language)} target="_blank" rel="noopener">{t('footer.privacy')}</a>
          <a className="ecl-link" href={localizedLink(site.links.footer.legal, language)} target="_blank" rel="noopener">{t('footer.legal')}</a>
          <a className="ecl-link" href={localizedLink(site.links.footer.cookies, language)} target="_blank" rel="noopener">{t('footer.cookies')}</a>
          <a className="ecl-link" href={accessibilityHref(language)}>{t('footer.accessibility')}</a>
        </nav>
      </div>
    </footer>
  )
}
