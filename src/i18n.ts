import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { site } from './config/toolConfig'

// One translation file per language in ./locales (en.json, fr.json, ...). The languages of the tool are listed in
// src/config/toolConfig.ts: to add one, add the file and an entry there.
const files = import.meta.glob<{ default: Record<string, unknown> }>('./locales/*.json', { eager: true })

const resources = Object.fromEntries(
  site.languages.map(({ code }) => {
    const file = files[`./locales/${code}.json`]
    if (!file) throw new Error(`Missing translation file src/locales/${code}.json (listed in site.languages).`)
    return [code, { translation: file.default }]
  }),
)

const supportedLanguages: string[] = site.languages.map(({ code }) => code)
const requestedLanguage = new URLSearchParams(window.location.search).get('language')
const initialLanguage =
  requestedLanguage && supportedLanguages.includes(requestedLanguage) ? requestedLanguage : site.defaultLanguage

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: site.defaultLanguage,
  supportedLngs: supportedLanguages,
  interpolation: { escapeValue: false },
})

export default i18n
