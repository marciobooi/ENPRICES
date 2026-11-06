import { useLayoutEffect, useRef, type KeyboardEvent, type RefObject } from 'react'

const ITEMS = 'button, input[type="checkbox"]'

/**
 * Keyboard navigation of a toolbar (WAI-ARIA toolbar pattern): the toolbar is one Tab stop, the left and right arrow
 * keys (and up and down) move between its controls, Home and End go to the first and the last. The control that
 * had focus last is the one Tab comes back to. Controls inside an open menu keep their own keys.
 */
export function useRovingToolbar(ref: RefObject<HTMLElement | null>) {
  const current = useRef<HTMLElement | null>(null)

  const items = (): HTMLElement[] =>
    ref.current
      ? [...ref.current.querySelectorAll<HTMLElement>(ITEMS)].filter(
          (element) => !element.closest('.share-popover') && !(element as HTMLButtonElement).disabled,
        )
      : []

  const apply = () => {
    const list = items()
    if (list.length === 0) return
    const active = current.current && list.includes(current.current) ? current.current : list[0]
    list.forEach((element) => {
      element.tabIndex = element === active ? 0 : -1
    })
  }

  // Controls come and go with the state of the chart, so the Tab stop is set again after every render (before the browser paints).
  useLayoutEffect(apply)

  return {
    onFocus: (event: React.FocusEvent<HTMLElement>) => {
      const target = event.target as HTMLElement
      if (items().includes(target)) {
        current.current = target
        apply()
      }
    },
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if ((event.target as Element).closest('.share-popover')) return
      const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End']
      if (!keys.includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return
      const list = items()
      const index = list.indexOf(event.target as HTMLElement)
      if (index === -1) return
      event.preventDefault()
      const last = list.length - 1
      const next =
        event.key === 'Home' ? 0
        : event.key === 'End' ? last
        : event.key === 'ArrowRight' || event.key === 'ArrowDown' ? (index === last ? 0 : index + 1)
        : index === 0 ? last : index - 1
      list[next].focus()
    },
  }
}
