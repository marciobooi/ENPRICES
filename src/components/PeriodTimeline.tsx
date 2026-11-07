import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { timelineStepMs } from '../config/toolConfig'
import { useDraggableToolbar } from '../hooks/useDraggableToolbar'
import { RoundButton } from './RoundButton'
import { ToolbarIcon } from './ToolbarIcon'
import { Tooltip } from './Tooltip'

interface PeriodTimelineProps {
  /** The periods the data has, oldest first. */
  periods: readonly string[]
  /** The period shown. */
  selected: string
  onSelect: (period: string) => void
  /** Told when the animation starts or stops (the chart announcements are paused while it runs). */
  onPlayingChange?: (playing: boolean) => void
}

const POSITION_KEY = 'enprices-timeline-position-v1'
const COLLAPSED_KEY = 'enprices-timeline-collapsed-v1'
/** Width one tick label needs, so the labels shown never touch. */
const LABEL_WIDTH = 60
/** The thumb is 24px wide: the track it can travel is 24px shorter than the slider. */
const THUMB = 24

/**
 * The period of the main view as a timeline: a play button that steps through the periods, and a slider with a tick for
 * every period and a label for as many of them as fit. It is a native range input (arrow keys, Home, End, Page Up and
 * Down; screen readers read the period as the value) drawn with the ECL blue. It replaces the period list of the menu.
 * Like the options bar it floats: drag its handle (or pick it up with Space and use the arrow keys) to move it, double-click
 * the handle (or press Enter on it) to tuck it away to the edge, click it to bring it back.
 */
export function PeriodTimeline({ periods, selected, onSelect, onPlayingChange }: PeriodTimelineProps) {
  const { t } = useTranslation()
  const sliderId = useId()
  const [playing, setPlaying] = useState(false)
  const [width, setWidth] = useState(0)
  const track = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const helpId = useId()
  const messages = useMemo(
    () => ({ picked: t('timeline.picked'), dropped: t('timeline.dropped'), cancelled: t('timeline.cancelled'), reset: t('timeline.resetDone'), collapsed: t('timeline.collapsed'), expanded: t('timeline.expanded') }),
    [t],
  )
  const drag = useDraggableToolbar(barRef, messages, { position: POSITION_KEY, collapsed: COLLAPSED_KEY })
  const last = periods.length - 1
  const index = Math.max(0, periods.indexOf(selected))

  const play = (value: boolean) => {
    setPlaying(value)
    onPlayingChange?.(value)
  }

  // How many labels fit: every n-th period gets one (the first and the last always do).
  useLayoutEffect(() => {
    const element = track.current
    if (!element) return
    const measure = () => setWidth(element.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // The animation: wait a moment on a period, then go to the next; the last one ends it.
  useEffect(() => {
    if (!playing || index >= last) return
    const timer = window.setTimeout(() => {
      onSelect(periods[index + 1])
      if (index + 1 >= last) {
        setPlaying(false)
        onPlayingChange?.(false)
      }
    }, timelineStepMs)
    return () => window.clearTimeout(timer)
  }, [playing, index, last, periods, onSelect, onPlayingChange])

  // Leaving the page (or the view) ends the animation, and with it the paused announcements.
  const stop = useRef(onPlayingChange)
  useEffect(() => {
    stop.current = onPlayingChange
  })
  useEffect(() => () => stop.current?.(false), [])

  if (last < 1) return null

  const every = Math.max(1, Math.ceil(periods.length / Math.max(2, Math.floor(width / LABEL_WIDTH))))
  const at = (i: number) => `calc(${(i / last) * 100}% + ${THUMB / 2 - (i / last) * THUMB}px)`
  // Ticks no closer than 6px: on a narrow screen only some periods get one, so they stay separate marks, not a solid bar.
  const tickEvery = Math.max(1, Math.ceil(periods.length / Math.max(2, Math.floor(width / 6))))
  // The labels: the selected period always, then the last, the first and every n-th one, each only if it is at least a
  // label's width away from the labels already chosen, so no two ever overlap.
  const x = (i: number) => (i / last) * Math.max(width - THUMB, 1)
  const candidates = [index, last, 0, ...Array.from({ length: last + 1 }, (_, i) => i).filter((i) => i % every === 0)]
  const shown = new Set<number>()
  for (const candidate of candidates) {
    if ([...shown].every((other) => Math.abs(x(candidate) - x(other)) >= LABEL_WIDTH)) shown.add(candidate)
  }
  const labelled = (i: number) => shown.has(i)

  return (
    <div
      ref={barRef}
      className={`period-timeline${drag.dragging ? ' period-timeline--dragging' : ''}${drag.grabbed ? ' period-timeline--grabbed' : ''}${drag.collapsed ? ' period-timeline--collapsed' : ''}`}
      id="period-timeline"
      role="group"
      aria-label={t('timeline.label')}
      style={drag.style}
    >
      {/* What the handle does, also when only the tab is left at the edge: the help text already describes it for screen readers */}
      <Tooltip content={t(drag.collapsed ? 'timeline.showTip' : 'timeline.handleTip')} announce={false}>
        <button
          type="button"
          id="timeline-move"
          className="floating-controls__handle period-timeline__handle"
          aria-label={t('timeline.move')}
          aria-describedby={helpId}
          aria-pressed={drag.grabbed}
          aria-expanded={!drag.collapsed}
          {...drag.handleProps}
        >
          <ToolbarIcon name={drag.collapsed ? 'expand' : drag.grabbed ? 'move' : 'grip'} />
        </button>
      </Tooltip>
      <span id={helpId} className="ecl-u-sr-only">{t('timeline.moveHelp')}</span>
      {!drag.collapsed && (
        <>
      <RoundButton
        id="timeline-play"
        icon={playing ? 'pause' : 'play'}
        label={t(playing ? 'timeline.pause' : 'timeline.play')}
        onClick={() => {
          if (!playing && index >= last) onSelect(periods[0])
          play(!playing)
        }}
      />
      <div className="period-timeline__slider">
        <div className="period-timeline__bubble" style={{ left: at(index) }} aria-hidden="true">{periods[index]}</div>
        <div className="period-timeline__track" ref={track}>
          <input
            id={sliderId}
            type="range"
            className="period-timeline__input"
            min={0}
            max={last}
            step={1}
            value={index}
            aria-label={t('timeline.slider')}
            aria-valuetext={periods[index]}
            style={{ '--filled': at(index) } as React.CSSProperties}
            onChange={(event) => {
              play(false)
              onSelect(periods[Number(event.target.value)])
            }}
          />
        </div>
        <div className="period-timeline__ticks" aria-hidden="true">
          {periods.map((period, i) => (
            <span key={period}>
              {(i % tickEvery === 0 || i === last) && <span className="period-timeline__tick" style={{ left: at(i) }} />}
              {labelled(i) && (
                <span className={`period-timeline__label${i === index ? ' period-timeline__label--selected' : ''}`} style={{ left: at(i) }}>
                  {period}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
        </>
      )}
      <span className="ecl-u-sr-only" role="status" aria-live="polite">{playing ? t('timeline.playing') : drag.message}</span>
    </div>
  )
}
