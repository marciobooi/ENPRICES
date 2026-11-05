import { driver, type DriveStep, type Driver, type PopoverDOM } from 'driver.js'
import { createFocusTrap } from './hooks/useFocusTrap'

const CLOSE_ICON =
  '<svg class="toolbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" ' +
  'stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" /></svg>'

const add = (element: Element, classes: string) => element.classList.add(...classes.split(' '))

/** The popover look comes from ECL classes (driver.js only positions it). */
function applyEclClasses(popover: PopoverDOM, closeLabel: string) {
  add(popover.wrapper, 'ecl-u-bg-white ecl-u-pv-l ecl-u-ph-xl')
  add(popover.title, 'ecl-u-type-heading-4 ecl-u-pb-m ecl-u-pr-2xl ecl-u-border-bottom ecl-u-border-color-dark-10')
  add(popover.description, 'ecl-u-type-paragraph ecl-u-mt-m')
  add(popover.progress, 'ecl-u-type-paragraph-s ecl-u-type-color-dark-80')
  add(popover.footer, 'ecl-u-d-flex ecl-u-justify-content-between ecl-u-align-items-center ecl-u-mt-l')
  add(popover.footerButtons, 'ecl-u-d-flex')
  add(popover.previousButton, 'ecl-button ecl-button--secondary')
  add(popover.nextButton, 'ecl-button ecl-button--primary ecl-u-ml-s')

  // Same round close button as the language popover (RoundButton): ECL primary, icon only.
  const close = popover.closeButton
  add(close, 'ecl-button ecl-button--primary ecl-button--icon-only round-button popover-close')
  close.setAttribute('aria-label', closeLabel)
  // Same inner markup as RoundButton, and drop driver's inline `display: block` so the flex centring applies.
  close.innerHTML = `<span class="ecl-button__container">${CLOSE_ICON}</span>`
  close.style.removeProperty('display')
}

/**
 * Tooltip for the close button. The popover is built by driver.js (outside React), so this is the plain-DOM twin
 * of Tooltip.tsx and uses the same classes. The text repeats the button's aria-label, so it is not linked with
 * aria-describedby (screen readers would read the name twice); the bubble is hidden from them (aria-hidden).
 */
function attachCloseTooltip(popover: PopoverDOM, text: string) {
  const { wrapper, closeButton } = popover
  wrapper.querySelector('.tooltip-bubble')?.remove()
  const bubble = document.createElement('span')
  bubble.className = 'tooltip-bubble tooltip-bubble--close'
  bubble.setAttribute('aria-hidden', 'true')
  bubble.hidden = true
  bubble.textContent = text
  wrapper.append(bubble)

  let timer: number | undefined
  const show = (instant: boolean) => {
    window.clearTimeout(timer)
    if (instant) bubble.hidden = false
    else timer = window.setTimeout(() => (bubble.hidden = false), 150)
  }
  const hide = () => {
    window.clearTimeout(timer)
    bubble.hidden = true
  }
  closeButton.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'touch') show(false)
  })
  closeButton.addEventListener('pointerleave', hide)
  closeButton.addEventListener('pointerdown', hide)
  closeButton.addEventListener('focus', () => {
    if (closeButton.matches(':focus-visible')) show(true)
  })
  closeButton.addEventListener('blur', hide)
}

export interface TourLabels {
  next: string
  previous: string
  done: string
  close: string
  /** Uses driver.js placeholders, e.g. "{{current}} of {{total}}". */
  progress: string
}

/**
 * Start the guided tour. Steps whose element is not in the page are skipped.
 * Focus returns to the element that had it before the tour started.
 */
export function startGuidedTour(steps: DriveStep[], labels: TourLabels, onEnd?: () => void): void {
  const available = steps.filter(
    (step) => typeof step.element !== 'string' || document.querySelector(step.element),
  )
  if (available.length === 0) return

  const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
  const appRoot = document.getElementById('root')
  let releaseTrap: (() => void) | null = null
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const tour: Driver = driver({
    steps: available,
    showProgress: true,
    animate: !reduceMotion,
    smoothScroll: !reduceMotion,
    allowClose: true,
    // driver.js' own key handling only cycles the footer buttons (the close button is skipped).
    // The focus trap below owns Tab and Escape instead.
    allowKeyboardControl: false,
    // The highlighted element is shown, not usable: clicks on it are blocked during the tour.
    disableActiveInteraction: true,
    nextBtnText: labels.next,
    prevBtnText: labels.previous,
    doneBtnText: labels.done,
    progressText: labels.progress,
    popoverClass: 'tour-popover',
    // Neutral dark backdrop (ECL dark-140) and a rounded, padded highlight.
    overlayColor: '#262b38',
    overlayOpacity: 0.65,
    stagePadding: 8,
    stageRadius: 8,
    onHighlightStarted: () => {
      // The whole app is unreachable (no Tab, no click, hidden from screen readers) while the tour runs.
      appRoot?.setAttribute('inert', '')
    },
    onPopoverRender: (popover, { state }) => {
      applyEclClasses(popover, labels.close)
      attachCloseTooltip(popover, labels.close)
      // Nothing to go back to on the first (welcome) step: hide the button instead of showing a dead one.
      popover.previousButton.style.display = state.activeIndex === 0 ? 'none' : ''
      popover.wrapper.setAttribute('role', 'dialog')
      popover.wrapper.setAttribute('aria-labelledby', popover.title.id || 'driver-popover-title')
      popover.wrapper.setAttribute('aria-describedby', popover.description.id || 'driver-popover-description')

      // Keep focus inside the popover: close button, Previous and Next all take part. Escape ends the tour.
      releaseTrap?.()
      releaseTrap = createFocusTrap(popover.wrapper, {
        initialFocus: '.driver-popover-next-btn',
        returnFocus: false,
        closeOnEscape: true,
        closeOnOutsideClick: false,
        onDeactivate: () => tour.destroy(),
      })
      // driver.js moves focus after rendering; put it on the primary action (Next / Done).
      requestAnimationFrame(() => popover.nextButton.focus())
    },
    onDestroyed: () => {
      releaseTrap?.()
      releaseTrap = null
      appRoot?.removeAttribute('inert')
      onEnd?.()
      if (previouslyFocused?.isConnected) previouslyFocused.focus()
    },
  })
  tour.drive()
}
