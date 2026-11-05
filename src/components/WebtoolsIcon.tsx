export type WebtoolsIconSet = 'phosphor' | 'networks'

interface WebtoolsIconProps {
  /** Icon family: `phosphor` (interface icons) or `networks` (social networks). */
  set: WebtoolsIconSet
  /** Icon name in the set, e.g. `lightbulb` or `facebook`. */
  name: string
  className?: string
}

/**
 * Icon from the Webtools icon library: the documented class is `wt-icon-<set>--<name>`
 * (https://webtools.europa.eu/showcase/demo/?comp=icons).
 *
 * Webtools replaces the inner span with an inline <svg> shortly after it appears. The wrapper is the node React
 * owns, so React never diffs or removes the element Webtools swaps. The icon follows the surrounding text colour.
 */
export function WebtoolsIcon({ set, name, className = '' }: WebtoolsIconProps) {
  return (
    <span className={`webtools-icon ${className}`.trim()} aria-hidden="true">
      <span className={`wt-icon-${set}--${name} ecl-icon ecl-icon--m`} />
    </span>
  )
}
