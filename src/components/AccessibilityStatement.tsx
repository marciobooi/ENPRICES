import type { ReactNode } from 'react'
import type { AccessibilityStatementConfig, StatementSection, StatementText } from '../accessibility/statementConfig'

interface AccessibilityStatementProps {
  config: AccessibilityStatementConfig
  /** Where "Back to the tool" goes. */
  backHref: string
}

const COMPLIANCE_LABEL = {
  fully: 'fully compliant',
  partially: 'partially compliant',
  not: 'not compliant',
} as const

function NewTabLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="ecl-link" href={href} target="_blank" rel="noopener">
      {children}
      <span className="ecl-u-sr-only"> (opens in new tab)</span>
    </a>
  )
}

function Paragraphs({ paragraphs }: { paragraphs: string[] }) {
  return paragraphs.map((text) => <p key={text} className="ecl-u-type-paragraph">{text}</p>)
}

function List({ items }: { items?: string[] }) {
  if (!items?.length) return null
  return (
    <ul className="ecl-unordered-list">
      {items.map((item) => <li key={item} className="ecl-unordered-list__item">{item}</li>)}
    </ul>
  )
}

function BackButton({ href }: { href: string }) {
  return (
    <div className="a11y-actions">
      <a className="ecl-button ecl-button--primary" href={href}>
        <span className="ecl-button__container">
          <span className="ecl-button__label" data-ecl-label="true">Back to the tool</span>
        </span>
      </a>
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  const anchor = `a11y-${id}`
  return (
    <section
      id={anchor}
      className="ecl-u-border-top ecl-u-border-color-primary-20 ecl-u-mt-xl ecl-u-pt-l"
      aria-labelledby={`${anchor}-title`}
    >
      <h3 className="ecl-u-type-heading-2" id={`${anchor}-title`}>{title}</h3>
      {children}
    </section>
  )
}

function TextSection({ id, title, text }: { id: string; title: string; text: StatementText }) {
  return (
    <Section id={id} title={title}>
      <Paragraphs paragraphs={text.paragraphs} />
      <List items={text.items} />
    </Section>
  )
}

/**
 * English-only accessibility statement (same structure for every tool).
 * Heading levels: the site header already has the page h1, so the statement title is an h2 and sections are h3.
 */
export function AccessibilityStatement({ config, backHref }: AccessibilityStatementProps) {
  const { productionUrl, feedback } = config

  const sections: Array<Pick<StatementSection, 'id' | 'title'>> = [
    { id: 'compliance-status', title: 'Compliance status' },
    { id: 'preparation-of-this-statement', title: 'Preparation of this statement' },
    { id: 'feedback', title: 'Feedback' },
    { id: 'compatibility-with-browsers-and-assistive-technology', title: 'Compatibility with browsers and assistive technology' },
    { id: 'technical-specifications', title: 'Technical specifications' },
    { id: 'non-accessible-content', title: 'Non-accessible content' },
    ...(config.extraSections ?? []).map(({ id, title }) => ({ id, title })),
  ]

  return (
    <div
      id="accessibilityView"
      className="a11y-statement"
      lang="en"
      role="region"
      aria-labelledby="a11y-statement-title"
    >
      <div className="a11y-wrapper">
        <BackButton href={backHref} />

        <h2 className="ecl-u-type-heading-1" id="a11y-statement-title" tabIndex={-1}>Accessibility statement</h2>

        <div className="a11y-intro">
          <p className="ecl-u-type-paragraph">This statement applies to content published on the domain:</p>
          <ul className="ecl-unordered-list">
            <li className="ecl-unordered-list__item">
              <NewTabLink href={productionUrl}>{productionUrl}</NewTabLink>
            </li>
          </ul>
          <p className="ecl-u-type-paragraph">
            It does not apply to other content or websites published on any of its subdomains. These websites and
            their content will have their own specific accessibility statement.
          </p>
          <p className="ecl-u-type-paragraph">
            This interactive tool is managed by Eurostat. It is designed to be used by as many people as possible,
            including people with disabilities.
          </p>
          <p className="ecl-u-type-paragraph">You should be able to:</p>
          <List items={config.youShouldBeAbleTo} />
          <p className="ecl-u-type-paragraph">
            This interactive tool is designed to comply with the technical standard for websites and mobile apps,{' '}
            EN 301 549, v.3.2.1. This closely follows level AA of the{' '}
            <NewTabLink href="https://www.w3.org/TR/WCAG21/">Web Content Accessibility Guidelines (WCAG)</NewTabLink>
            {' '}version 2.1.
          </p>
        </div>

        <nav className="a11y-toc ecl-u-mt-l" aria-labelledby="a11y-toc-title">
          <h3 className="ecl-u-type-heading-3" id="a11y-toc-title">On this page</h3>
          <ul className="ecl-unordered-list">
            {sections.map(({ id, title }) => (
              <li key={id} className="ecl-unordered-list__item">
                <a className="ecl-link" href={`#a11y-${id}`}>{title}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="a11y-sections">
          <Section id="compliance-status" title="Compliance status">
            <p className="ecl-u-type-paragraph">
              This interactive tool is <strong>{COMPLIANCE_LABEL[config.compliance]}</strong> with technical
              standard EN 301 549 v.3.2.1 and the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA. See “
              <a className="ecl-link" href="#a11y-non-accessible-content">Non-accessible content</a>” for more
              details.
            </p>
            <p className="ecl-u-type-paragraph">The interactive tool was last tested on {config.lastTested}.</p>
            <p className="ecl-u-type-paragraph">This statement was last reviewed on {config.lastReviewed}.</p>
          </Section>

          <TextSection
            id="preparation-of-this-statement"
            title="Preparation of this statement"
            text={config.preparation}
          />

          <Section id="feedback" title="Feedback">
            <p className="ecl-u-type-paragraph">
              We welcome your feedback on the accessibility of the Eurostat website. Please let us know if you
              encounter accessibility barriers:
            </p>
            <ul className="ecl-unordered-list">
              {feedback.phone && (
                <li className="ecl-unordered-list__item">
                  Phone: <a className="ecl-link" href={`tel:${feedback.phone.replace(/\s+/g, '')}`}>{feedback.phone}</a>
                </li>
              )}
              {feedback.email && (
                <li className="ecl-unordered-list__item">
                  E-mail: <a className="ecl-link" href={`mailto:${feedback.email}?subject=Accessibility`}>{feedback.email}</a>
                </li>
              )}
              {feedback.contactFormUrl && (
                <li className="ecl-unordered-list__item">
                  <NewTabLink href={feedback.contactFormUrl}>{feedback.contactFormLabel ?? 'Contact form'}</NewTabLink>
                </li>
              )}
            </ul>
            {feedback.responseTime && <p className="ecl-u-type-paragraph">{feedback.responseTime}</p>}
          </Section>

          <TextSection
            id="compatibility-with-browsers-and-assistive-technology"
            title="Compatibility with browsers and assistive technology"
            text={config.compatibility}
          />
          <TextSection id="technical-specifications" title="Technical specifications" text={config.technicalSpecifications} />
          <TextSection id="non-accessible-content" title="Non-accessible content" text={config.nonAccessibleContent} />

          {config.extraSections?.map((section) => (
            <TextSection key={section.id} id={section.id} title={section.title} text={section} />
          ))}
        </div>

        <BackButton href={backHref} />
      </div>
    </div>
  )
}
