const WEBTOOLS_LOADER_ID = 'european-commission-webtools-loader'
const UTILITY_CONFIG_PREFIX = 'european-commission-webtools-config'

let loaderPromise: Promise<void> | undefined

interface WebtoolsApi {
  render: (target: Element, config: object) => void
  globan?: { regenerate: (params?: { lang?: string }) => void }
}

const getWt = () => (window as unknown as { $wt?: WebtoolsApi }).$wt

function renderGloban() {
  const container = document.getElementById('euGlobanContainer')
  const wt = getWt()
  if (!container || !wt || container.childElementCount > 0) return

  wt.render(container, {
    service: 'globan',
    theme: 'dark',
    logo: true,
    link: true,
    lang: document.documentElement.lang || 'en',
    mode: false,
    zindex: 40,
  })
}

/** Re-render GloBan in a new language (documented SPA method). No-op until it has been rendered. */
function setLanguage(lang: string) {
  const wt = getWt()
  if (document.querySelector('#euGlobanContainer > *')) wt?.globan?.regenerate({ lang })
}

function getUtilityConfigurations(): Array<Record<string, string | number | boolean>> {
  const utilities: Array<Record<string, string | number | boolean>> = [
    {
      utility: 'cck',
      url: 'https://commission.europa.eu/cookies-policy_{lang}',
    },
  ]

  // Analytics belongs to ONE tool: its site and instance come from .env (ask the Webtools team). With no site ID
  // there is no analytics; no other tool's ID is ever used as a default.
  const siteID = import.meta.env.VITE_WEBTOOLS_ANALYTICS_SITE_ID
  if (siteID) {
    utilities.push({
      utility: 'analytics',
      siteID,
      instance: import.meta.env.VITE_WEBTOOLS_ANALYTICS_INSTANCE || 'ec.europa.eu',
      is404: import.meta.env.VITE_WEBTOOLS_IS_404 === 'true',
    })
  }
  return utilities
}

function loadWebtools(): Promise<void> {
  if (loaderPromise) return loaderPromise

  loaderPromise = new Promise<void>((resolve, reject) => {
    // Render GloBan when the loader is ready; if it already is (loader tag present, e.g. after HMR), render now.
    window.addEventListener('wtReady', renderGloban, { once: true })
    if (document.getElementById(WEBTOOLS_LOADER_ID)) {
      renderGloban()
      resolve()
      return
    }

    getUtilityConfigurations().forEach((configuration) => {
      const configId = `${UTILITY_CONFIG_PREFIX}-${configuration.utility}`
      if (document.getElementById(configId)) return

      const configScript = document.createElement('script')
      configScript.id = configId
      configScript.type = 'application/json'
      configScript.textContent = JSON.stringify(configuration)
      document.body.append(configScript)
    })

    const loader = document.createElement('script')
    loader.id = WEBTOOLS_LOADER_ID
    loader.src = 'https://webtools.europa.eu/load.js?spa=1'
    loader.defer = true
    loader.onload = () => resolve()
    loader.onerror = () => {
      loader.remove()
      window.removeEventListener('wtReady', renderGloban)
      loaderPromise = undefined
      reject(new Error('The European Commission Webtools Smart Loader could not be loaded.'))
    }
    document.head.append(loader)
  })

  return loaderPromise
}

export const webtoolsService = {
  initialize: loadWebtools,
  setLanguage,
  getChartEmbedUrl(): string | undefined {
    return import.meta.env.VITE_WEBTOOLS_CHART_URL || undefined
  },
}
