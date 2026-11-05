import { site } from '../config/toolConfig'

/** The mailbox that receives the contact e-mail: `contactEmail` in src/config/toolConfig.ts. */
export const CONTACT_EMAIL = site.contactEmail

export interface EmailDetail {
  label: string
  value: string
}

interface EmailContent {
  subject: string
  /** Opening lines, before the context block. */
  greeting: string
  /** Heading of the block where the user writes their message. */
  yourMessage: string
  /** Heading of the context block. */
  contextHeading: string
  /** "label: value" lines of the context block, most important first. */
  details: EmailDetail[]
  /** What happened to the screenshot (translated), or '' when there is none. */
  screenshotNote: string
}

// Windows mail clients cut `mailto:` links around 2,000 characters; stay well below.
const MAX_LENGTH = 1700
const NEW_LINE = '\r\n'

function buildAddress({ subject, greeting, yourMessage, contextHeading, details, screenshotNote }: EmailContent): string {
  const body = [
    greeting,
    '',
    yourMessage,
    '',
    '',
    '----------------------------------------',
    contextHeading,
    ...details.map(({ label, value }) => `${label}: ${value}`),
    ...(screenshotNote ? ['', screenshotNote] : []),
  ].join(NEW_LINE)
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

/**
 * Build the `mailto:` link of a contact e-mail: fixed recipient, subject, a place to write, and the context a
 * support team needs (tool, address, language, date, filters, window, browser). When the link would be too long
 * for mail clients, the least useful details (the last ones) are dropped first.
 */
export function buildContactEmail(content: EmailContent): string {
  let details = content.details
  let address = buildAddress({ ...content, details })
  while (address.length > MAX_LENGTH && details.length > 3) {
    details = details.slice(0, -1)
    address = buildAddress({ ...content, details })
  }
  return address
}
