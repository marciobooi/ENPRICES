import type { ReactNode } from 'react'
import { WebtoolsIcon } from './WebtoolsIcon'

/**
 * Single consistent icon set for toolbar buttons: 24px grid, 2px round stroke,
 * no built-in circle (the RoundButton supplies the circle), colour via currentColor.
 */
const PATHS = {
  'caret-down': <path d="m6 9 6 6 6-6" />,
  check: <path d="M20 6 9 17l-5-5" />,
  close: <path d="M6 6l12 12M18 6L6 18" strokeWidth="2.5" />,
  menu: (
    <>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </>
  ),
  info: (
    <>
      <path d="M12 10.5V19" />
      <circle cx="12" cy="5.5" r="1.25" fill="currentColor" stroke="none" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.59 13.51 6.83 3.98" />
      <path d="m15.41 6.51-6.82 3.98" />
    </>
  ),
  embed: (
    <>
      <path d="m16 18 6-6-6-6" />
      <path d="m8 6-6 6 6 6" />
    </>
  ),
  'arrow-up': (
    <>
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </>
  ),
  'chart-bar': (
    <>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M9 16v-5M13 16V8M17 16v-3" strokeWidth="2.5" />
    </>
  ),
  'chart-pie': (
    <>
      <path d="M12 3v9h9" />
      <path d="M20.5 15.5A9 9 0 1 1 8.5 3.5" />
    </>
  ),
  'chart-line': (
    <>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="m7 15 4-5 3 3 5-6" />
    </>
  ),
  table: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <path d="M3 10h18M3 15h18M9 4v16" />
    </>
  ),
  grip: (
    <>
      <circle cx="9" cy="6" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="6" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="9" cy="18" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="18" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  excel: (
    <>
      <path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z" />
      <path d="M14 3v4h4" />
      <path d="m9.5 11 5 6M14.5 11l-5 6" />
    </>
  ),
  sort: (
    <>
      <path d="M3 6h11M3 12h7M3 18h3" />
      <path d="M18 5v14" />
      <path d="m15 16 3 3 3-3" />
    </>
  ),
  layers: (
    <>
      <rect x="3" y="3" width="12" height="12" rx="1" />
      <rect x="9" y="9" width="12" height="12" rx="1" />
    </>
  ),
  percent: (
    <>
      <path d="M19 5 5 19" />
      <circle cx="7" cy="7" r="2.5" />
      <circle cx="17" cy="17" r="2.5" />
    </>
  ),
  help: (
    <>
      <path d="M8 8.5a4 4 0 1 1 5.6 3.66c-1 .5-1.6 1.2-1.6 2.34" />
      <circle cx="12" cy="19" r="1.25" fill="currentColor" stroke="none" />
    </>
  ),
} satisfies Record<string, ReactNode>

/**
 * Icons that already exist in the Webtools icon set are used as they are (no need to redraw them): add the documented
 * class `wt-icon-phosphor--<name>` (see WebtoolsIcon) and list the name here.
 */
const WEBTOOLS_ICONS = {
  lightbulb: 'lightbulb',
} as const

export type ToolbarIconName = keyof typeof PATHS | keyof typeof WEBTOOLS_ICONS

export function ToolbarIcon({ name, className = '' }: { name: ToolbarIconName; className?: string }) {
  if (name in WEBTOOLS_ICONS) {
    return (
      <WebtoolsIcon
        set="phosphor"
        name={WEBTOOLS_ICONS[name as keyof typeof WEBTOOLS_ICONS]}
        className={`toolbar-icon ${className}`.trim()}
      />
    )
  }

  return (
    <svg
      className={`toolbar-icon ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name as keyof typeof PATHS]}
    </svg>
  )
}
