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
          <RoundButton href="#top" icon="arrow-up" variant="primary" label={t('footer.backToTop')} />
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
