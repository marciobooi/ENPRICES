/**
 * Accessibility statement content for THIS tool.
 *
 * This is the only file to edit per tool. The wording, dates, contacts and production URL must come
 * from the tool's accessibility statement Word document (the source of truth). Replace every
 * `<<PLACEHOLDER>>` before release; do not invent content.
 *
 * The statement is English only by design (it is not translated when the tool is in DE/FR).
 */

import { site } from '../config/toolConfig'

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
  }
  compatibility: StatementText
  technicalSpecifications: StatementText
  nonAccessibleContent: StatementText
  /** Extra tool-specific sections, shown after "Non-accessible content". */
  extraSections?: StatementSection[]
}

export const statementConfig: AccessibilityStatementConfig = {
  toolName: '<<TOOL NAME>>',
  productionUrl: site.url,
  lastTested: '<<D Month YYYY>>',
  lastReviewed: '<<D Month YYYY>>',
  compliance: 'partially',
  youShouldBeAbleTo: [
    'zoom up to 200% without problems',
    'navigate most of the tool using just a keyboard',
    'use the tool with a screen reader',
  ],
  preparation: {
    paragraphs: [
      'This statement was prepared on <<D Month YYYY>>.',
      '<<HOW THE TOOL WAS ASSESSED, as written in the Word statement>>',
    ],
  },
  feedback: {
    phone: '<<PHONE>>',
    email: '<<EMAIL>>',
    contactFormUrl: '<<CONTACT FORM URL>>',
  },
  compatibility: {
    paragraphs: ['<<BROWSERS AND ASSISTIVE TECHNOLOGY, as written in the Word statement>>'],
  },
  technicalSpecifications: {
    paragraphs: [
      'Accessibility of this tool relies on the following technologies to work with the particular combination of web browser and any assistive technologies or plugins installed on your computer:',
    ],
    items: ['HTML', 'WAI-ARIA', 'CSS', 'JavaScript'],
  },
  nonAccessibleContent: {
    paragraphs: ['The content listed below is non-accessible for the following reasons.'],
    items: ['<<NON-ACCESSIBLE CONTENT, as written in the Word statement>>'],
  },
}
