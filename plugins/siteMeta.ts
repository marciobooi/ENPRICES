import { loadEnv, type HtmlTagDescriptor, type Plugin } from 'vite'
import { shareImageUrl, site } from '../src/config/toolConfig.ts'

// Vite escapes attribute values itself (& and "), so the values are passed as they are.
const meta = (attrs: Record<string, string | number>): HtmlTagDescriptor => ({
  tag: 'meta',
  attrs: Object.fromEntries(Object.entries(attrs).map(([key, value]) => [key, String(value)])),
  // Appended to <head>: the charset declaration must stay within the first 1024 bytes of the document.
  injectTo: 'head',
})

/**
 * Writes the page identity of src/config/toolConfig.ts into the static HTML: title, description, canonical, Open Graph
 * and Twitter Card tags. Social crawlers (Facebook, LinkedIn, X) read these from the HTML, not from the running app.
 *
 * Deployment pipelines can override the page address without editing the file: set VITE_SITE_URL (the image address
 * follows it).
 */
export function siteMeta(): Plugin {
  let pageUrl: string = site.url

  return {
    name: 'site-meta',
    configResolved(config) {
      const env = loadEnv(config.mode, config.envDir, 'VITE_')
      pageUrl = env.VITE_SITE_URL || process.env.VITE_SITE_URL || site.url
    },
    transformIndexHtml(html) {
      const image = shareImageUrl(pageUrl)
      const codes = site.languages.map((language) => language.code)
      // The language of the page follows ?language= from the first paint (the app keeps it in sync afterwards).
      const languageScript =
        '(function(){var l=new URLSearchParams(location.search).get("language");var s=' +
        JSON.stringify(codes) +
        ';document.documentElement.lang=(l&&s.indexOf(l)>-1)?l:' +
        JSON.stringify(site.defaultLanguage) +
        '})()'
      const tags: HtmlTagDescriptor[] = [
        { tag: 'script', children: languageScript, injectTo: 'head' },
        { tag: 'title', children: site.title, injectTo: 'head' },
        meta({ name: 'description', content: site.description }),
        meta({ name: 'title', content: site.socialTitle }),
        meta({ name: 'keywords', content: site.keywords }),
        meta({ name: 'robots', content: site.robots }),
        meta({ name: 'author', content: site.author }),
        meta({ name: 'language', content: 'English' }),
        meta({ name: 'theme-color', content: site.themeColor }),
        { tag: 'link', attrs: { rel: 'canonical', href: pageUrl }, injectTo: 'head' },
        meta({ property: 'og:type', content: 'website' }),
        meta({ property: 'og:site_name', content: site.siteName }),
        meta({ property: 'og:title', content: site.socialTitle }),
        meta({ property: 'og:description', content: site.description }),
        meta({ property: 'og:url', content: pageUrl }),
        meta({ property: 'og:image', content: image }),
        meta({ property: 'og:image:secure_url', content: image }),
        meta({ property: 'og:image:type', content: site.image.type }),
        meta({ property: 'og:image:width', content: site.image.width }),
        meta({ property: 'og:image:height', content: site.image.height }),
        meta({ property: 'og:image:alt', content: site.image.alt }),
        meta({ property: 'og:locale', content: site.locale }),
        ...site.localeAlternates.map((locale) => meta({ property: 'og:locale:alternate', content: locale })),
        meta({ name: 'twitter:card', content: site.twitterCard }),
        meta({ name: 'twitter:url', content: pageUrl }),
        meta({ name: 'twitter:title', content: site.socialTitle }),
        meta({ name: 'twitter:description', content: site.description }),
        meta({ name: 'twitter:image', content: image }),
        meta({ name: 'twitter:image:alt', content: site.image.alt }),
      ]
      return {
        html: html.replace(/<html lang="[^"]*"/, `<html lang="${site.defaultLanguage}"`),
        tags,
      }
    },
  }
}
