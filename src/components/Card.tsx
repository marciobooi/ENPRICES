import { useId, type CSSProperties, type ReactNode } from 'react'

interface CardProps {
  title: string
  /** Heading level of the title, so the card fits the page outline. Default 3. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
  description?: string
  /** Decorative icon or emoji shown before the title (hidden from screen readers). */
  icon?: ReactNode
  /** Controls in the top-right corner, e.g. an information button. */
  actions?: ReactNode
  /** Main content of the card. */
  children?: ReactNode
  /** Content below a divider, e.g. a summary line or links. */
  footer?: ReactNode
  /** Colour of the accent bar on top of the card (any CSS colour). Default: ECL primary. */
  accentColor?: string
  /** Turns the title into a link. */
  href?: string
  id?: string
  className?: string
}

/**
 * Card on the ECL card classes (`ecl-card`, `ecl-card__body`, `ecl-content-block__*`), with the slots a data tool
 * needs: icon, title, description, actions, content and footer. It is an `<article>` named by its title.
 *
 * Put several in a `<div className="card-grid">` for a responsive grid.
 */
export function Card({
  title,
  headingLevel = 3,
  description,
  icon,
  actions,
  children,
  footer,
  accentColor,
  href,
  id,
  className = '',
}: CardProps) {
  const titleId = useId()
  const Heading = `h${headingLevel}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  const style = accentColor ? ({ '--card-accent': accentColor } as CSSProperties) : undefined

  return (
    <article id={id} className={`ecl-card tool-card ${className}`.trim()} style={style} aria-labelledby={titleId}>
      <div className="ecl-card__body">
        <header className="tool-card__header">
          {icon && <span className="tool-card__icon" aria-hidden="true">{icon}</span>}
          <div className="tool-card__heading">
            <Heading id={titleId} className="ecl-content-block__title tool-card__title">
              {href ? <a className="ecl-link ecl-link--standalone" href={href}>{title}</a> : title}
            </Heading>
            {description && <p className="ecl-content-block__description tool-card__description">{description}</p>}
          </div>
          {actions && <div className="tool-card__actions">{actions}</div>}
        </header>
        {children && <div className="tool-card__content">{children}</div>}
        {footer && <footer className="tool-card__footer">{footer}</footer>}
      </div>
    </article>
  )
}
