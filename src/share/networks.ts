import { CONTACT_EMAIL } from './email'

/** What is shared: the page address, a title and a short description (both translated by the caller). */
export interface ShareContent {
  url: string
  title: string
  text: string
}

export interface ShareNetwork {
  /** Key under `share.networks` in the locale files (the displayed name). */
  id: 'x' | 'facebook' | 'linkedin' | 'email'
  /** Icon name in the Webtools `networks` set: `wt-icon-networks--<icon>`. */
  icon: string
  /** Builds the address that opens the network's share dialog (or the mail client). */
  href: (content: ShareContent) => string
  /** Opens in a small window. Absent for the e-mail entry. */
  popup?: { width: number; height: number }
  /** The contact e-mail: ShareMenu builds the message itself (context, screenshot), `href` is only a fallback. */
  email?: boolean
}

const enc = encodeURIComponent

/**
 * How each network gets its preview card: X takes the text we send and reads the image from the Twitter Card tags;
 * Facebook and LinkedIn read title, description and image only from the Open Graph tags in index.html.
 * Add a network here (and its icon, name and locale key) to offer it in every tool. */
export const shareNetworks: ShareNetwork[] = [
  {
    id: 'x',
    icon: 'x',
    href: ({ url, text }) => `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`,
    popup: { width: 700, height: 400 },
  },
  {
    id: 'facebook',
    icon: 'facebook',
    // Facebook builds the post from the page's Open Graph tags (the old `quote` parameter is ignored).
    href: ({ url }) => `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
    popup: { width: 700, height: 500 },
  },
  {
    id: 'linkedin',
    icon: 'linkedin',
    // LinkedIn builds the post from the page's Open Graph tags (title, description and summary parameters are ignored).
    href: ({ url }) => `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
    popup: { width: 650, height: 450 },
  },
  {
    id: 'email',
    icon: 'email',
    href: () => `mailto:${CONTACT_EMAIL}`,
    email: true,
  },
]

/** Open a share dialog in a small window (the browser keeps it separate from the tool). */
export function openSharePopup(href: string, { width, height }: { width: number; height: number }): void {
  window.open(href, '_blank', `popup=yes,noopener,resizable=yes,scrollbars=yes,width=${width},height=${height}`)
}
