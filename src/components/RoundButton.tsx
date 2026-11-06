import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'
import { Tooltip } from './Tooltip'
import { ToolbarIcon, type ToolbarIconName } from './ToolbarIcon'

interface RoundButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> {
  /** Icon from the toolbar icon set. */
  icon: ToolbarIconName
  /** A short text (a number) drawn instead of the icon. */
  text?: string
  /** Accessible name; also used as the tooltip text unless `tooltip` is given. */
  label: string
  /** Tooltip text. Pass `false` to disable the tooltip. */
  tooltip?: string | false
  /** ECL button variant. `primary` (default) = filled blue, `secondary` = white with blue border. */
  variant?: 'secondary' | 'primary'
  /** Render as a link (navigation) instead of a button. */
  href?: string
}

/**
 * Circular icon-only button built on the ECL button
 * (keeps ECL's hover / focus / active / disabled states).
 */
export function RoundButton({
  icon,
  text,
  label,
  tooltip,
  variant = 'primary',
  href,
  className = '',
  type = 'button',
  ...buttonProps
}: RoundButtonProps) {
  const classes =
    `round-button ecl-button ecl-button--${variant} ecl-button--icon-only ${className}`.trim()

  const content = (
    <span className="ecl-button__container">
      {text ? <span className="round-button__text" aria-hidden="true">{text}</span> : <ToolbarIcon name={icon} />}
      <span className="ecl-button__label" data-ecl-label="true">{label}</span>
    </span>
  )

  // A link has no `disabled`; every other prop (onClick, data-*, aria-*, id) is forwarded.
  const { disabled, ...linkProps } = buttonProps
  const control = href ? (
    <a {...(linkProps as AnchorHTMLAttributes<HTMLAnchorElement>)} href={href} className={classes} aria-label={label}>
      {content}
    </a>
  ) : (
    <button {...buttonProps} disabled={disabled} type={type} className={classes} aria-label={label}>
      {content}
    </button>
  )

  if (tooltip === false) return control
  // The default tooltip repeats the accessible name, so it must not be announced a second time.
  return <Tooltip content={tooltip ?? label} announce={tooltip !== undefined}>{control}</Tooltip>
}
