import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { webtoolsService } from '../services/webtools'

/** Setup every page of the tool needs: <html lang> follows the UI language, Webtools (GloBan, CCK, analytics) loads once. */
export function useSiteShell() {
  const { i18n } = useTranslation()

  useEffect(() => {
    const language = i18n.resolvedLanguage ?? 'en'
    document.documentElement.lang = language
    webtoolsService.setLanguage(language)
  }, [i18n.resolvedLanguage])

  useEffect(() => {
    let active = true
    void webtoolsService.initialize().catch((serviceError: unknown) => {
      if (active) {
        console.error(
          serviceError instanceof Error
            ? serviceError.message
            : 'The Webtools service failed to initialize.',
        )
      }
    })
    return () => {
      active = false
    }
  }, [])
}
