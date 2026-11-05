/**
 * Accessibility statement content for THIS tool.
 *
 * The wording, dates, contacts and production URL are transcribed from ENPRICES' accessibility statement.
 *
 * The statement is English only by design (it is not translated when the tool is in DE/FR).
 */

export interface StatementText {
  /** Paragraphs shown before the list. */
  paragraphs: string[]
  /** Optional bullet list shown after the paragraphs. */
  items?: string[]
}

export interface StatementSection {
  /** Used for the anchor id (`a11y-<id>`) and the "On this page" index. */
  id: string
  title: string
  paragraphs: string[]
  items?: string[]
}

export interface AccessibilityStatementConfig {
  toolName: string
  /** Production URL the statement applies to. */
  productionUrl: string
  /** Written as `7 July 2026`. */
  lastTested: string
  lastReviewed: string
  /** Drives the wording of the "Compliance status" section. */
  compliance: 'fully' | 'partially' | 'not'
  /** Bullets after "You should be able to:". */
  youShouldBeAbleTo: string[]
  preparation: StatementText
  feedback: {
    phone?: string
    email?: string
    contactFormUrl?: string
    contactFormLabel?: string
    responseTime?: string
  }
  compatibility: StatementText
  technicalSpecifications: StatementText
  nonAccessibleContent: StatementText
  /** Extra tool-specific sections, shown after "Non-accessible content". */
  extraSections?: StatementSection[]
}

export const statementConfig: AccessibilityStatementConfig = {
  toolName: 'Energy prices visualisation tool',
  productionUrl: 'https://ec.europa.eu/eurostat/cache/visualisations/energy-prices/enprices.html',
  lastTested: '7 July 2026',
  lastReviewed: '27 July 2026',
  compliance: 'partially',
  youShouldBeAbleTo: [
    'zoom up to 200% without problems',
    'navigate the tool using just a keyboard',
    'navigate the tool using a modern screen reader and speech recognition software (on your computer or phone)',
  ],
  preparation: {
    paragraphs: [
      'This statement was reviewed on 27/07/2026.',
      'For this interactive tool the statement is based on a review using automated testing.',
    ],
  },
  feedback: {
    phone: '+352 4301 33 408',
    email: 'ESTAT-USER-SUPPORT@ec.europa.eu',
    contactFormUrl: 'https://ec.europa.eu/eurostat/web/main/contact-us/user-support',
    contactFormLabel: 'Multilingual user support page',
    responseTime: 'We try to respond to feedback within 15 business days from the date of receipt of the enquiry by the responsible Commission department.',
  },
  compatibility: {
    paragraphs: [
      'The Energy prices visualisation tool website is designed to be compatible with the following most used assistive technologies:',
    ],
    items: [
      'the latest version of Google Chrome and Apple Safari browsers;',
      'in combination with the latest versions of JAWS, NVDA, VoiceOver and TalkBack.',
    ],
  },
  technicalSpecifications: {
    paragraphs: [
      'The accessibility of the Energy prices visualisation tool website relies on the following technologies to work with the particular combination of web browser and any assistive technologies or plugins installed on your computer:',
    ],
    items: ['HTML', 'WAI-ARIA', 'CSS', 'JavaScript'],
  },
  nonAccessibleContent: {
    paragraphs: [
      'Despite our best efforts to ensure accessibility of the Energy prices visualisation tool website, we are aware of some limitations, which we are working to fix. Below is a description of known limitations and potential solutions. Please contact us if you encounter an issue not listed below.',
      'Known limitations for the Energy prices visualisation tool website:',
    ],
    items: [
      'Interactive tools / visualisations: The interactive tools and visualisations on this site do not always have text alternatives. We are aware that this is inaccessible for people using the screen reader or keyboard. However, all visualisations provide a direct link to the source dataset to display the data in table format.',
      'Automatically generated, downloadable documents in PDF format are not fully accessible.',
      'The tool is optimized for standard screen sizes, the user experience may be degraded on smaller displays (mobile phones and similar devices).',
    ],
  },
}
