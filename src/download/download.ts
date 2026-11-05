import { downloadConfig } from '../config/toolConfig'
import { captureElement, downloadImage } from '../share/screenshot'

export type DownloadFormat = (typeof downloadConfig.formats)[number]

/** The data of the chart as a table: what the Excel file contains. */
export interface DownloadTable {
  /** Name of the worksheet. */
  sheet: string
  headers: string[]
  rows: (string | number)[][]
  /** Heading above the table: the title and subtitle of the view. */
  title?: string
  subtitle?: string
  /** Lines under the table: source, dataset, link, unit, date. */
  notes?: string[]
}

const today = () => new Date().toISOString().slice(0, 10)

/** `eurostat-tool-2026-11-05.png` */
function fileName(extension: string): string {
  return `${downloadConfig.fileName}-${today()}.${extension}`
}

interface HighchartsChart {
  container: HTMLElement
  chartWidth: number
  chartHeight: number
  exportChartLocal: (options: Record<string, unknown>, chartOptions?: Record<string, unknown>) => void
}

/** The Highcharts chart drawn inside an element (the Webtools chart service loads Highcharts on the page). */
function findHighchart(element: HTMLElement): HighchartsChart | undefined {
  const highcharts = (window as unknown as { Highcharts?: { charts: Array<HighchartsChart | undefined> } }).Highcharts
  return highcharts?.charts.find((chart): chart is HighchartsChart => !!chart && typeof chart.exportChartLocal === 'function' && element.contains(chart.container))
}

/** The Eurostat logo, as a data address (an image of another address would block the export). Null when it can't be loaded. */
async function loadLogo(): Promise<{ src: string; width: number; height: number } | null> {
  try {
    const response = await fetch(downloadConfig.logoUrl)
    if (!response.ok) return null
    const svg = await response.text()
    const src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
    const box = /viewBox="[\d.\s-]*?([\d.]+)\s+([\d.]+)"/.exec(svg)
    const ratio = box ? Number(box[1]) / Number(box[2]) : 4
    const height = 20
    return { src, width: Math.round(height * (Number.isFinite(ratio) && ratio > 0 ? ratio : 4)), height }
  } catch {
    return null
  }
}

/** Save the chart (the element of `downloadConfig.imageTarget`) as PNG or JPEG. Returns false when it fails. */
export async function downloadChartImage(type: 'png' | 'jpeg', heading?: { title?: string; subtitle?: string }): Promise<boolean> {
  const target = document.querySelector<HTMLElement>(downloadConfig.imageTarget)
  if (!target) return false
  // The chart exports itself (Highcharts, in the browser, no server): exactly what is drawn, sharp at any size.
  const chart = findHighchart(target)
  if (chart) {
    try {
      const logo = await loadLogo()
      const headerHeight = heading?.title || heading?.subtitle ? 90 : 0
      const footerHeight = logo ? logo.height + 16 : 0
      const width = chart.chartWidth
      // Only the exported image gets the title and the logo; the chart on screen is not touched.
      chart.exportChartLocal(
        { type: type === 'png' ? 'image/png' : 'image/jpeg', filename: fileName(type === 'png' ? 'png' : 'jpg').replace(/\.[^.]+$/, ''), scale: 2, sourceWidth: chart.chartWidth, sourceHeight: chart.chartHeight + headerHeight + footerHeight },
        {
          chart: {
            backgroundColor: '#ffffff',
            height: chart.chartHeight + headerHeight + footerHeight,
            spacingTop: 15,
            spacingBottom: footerHeight + 10,
            events: {
              load(this: { renderer: { image: (src: string, x: number, y: number, w: number, h: number) => { add: () => void } }; chartHeight: number; chartWidth: number }) {
                if (logo) this.renderer.image(logo.src, this.chartWidth - logo.width - 10, this.chartHeight - logo.height - 10, logo.width, logo.height).add()
              },
            },
          },
          title: heading?.title
            ? { text: heading.title, align: 'left', style: { fontSize: '16px', fontWeight: 'bold', color: '#003d8d', width: `${width - 40}px` } }
            : { text: '' },
          subtitle: heading?.subtitle
            ? { text: heading.subtitle, align: 'left', style: { fontSize: '13px', color: '#262b38', width: `${width - 40}px` } }
            : { text: '' },
        },
      )
      return true
    } catch {
      // fall back to a screenshot of the page area
    }
  }
  const image = await captureElement(target, type === 'png' ? 'image/png' : 'image/jpeg')
  if (!image) return false
  downloadImage(image, fileName(type === 'png' ? 'png' : 'jpg'))
  return true
}

/** Save the data of the chart as an .xlsx file. The library is loaded on demand. Returns false when it fails. */
export async function downloadExcel(table: DownloadTable): Promise<boolean> {
  try {
    const { default: writeXlsxFile } = await import('write-excel-file/universal')
    const blue = '#0e47cb'
    const line = '#c9d1e3'
    const width = table.headers.length
    const blank = Array.from({ length: width }, () => null)
    const title = table.title ? [[{ value: table.title, fontWeight: 'bold' as const, fontSize: 14, textColor: '#003d8d' }, ...blank.slice(1)]] : []
    const subtitle = table.subtitle ? [[{ value: table.subtitle, fontSize: 11, textColor: '#262b38' }, ...blank.slice(1)]] : []
    const heading = [...title, ...subtitle]
    const header = table.headers.map((value) => ({
      value,
      fontWeight: 'bold' as const,
      textColor: '#ffffff',
      backgroundColor: blue,
      align: 'center' as const,
      alignVertical: 'center' as const,
      wrap: true,
      height: 34,
      borderColor: blue,
    }))
    const rows = table.rows.map((row) =>
      row.map((value, column) => ({
        value,
        fontWeight: column === 0 ? ('bold' as const) : undefined,
        align: column === 0 ? ('left' as const) : ('right' as const),
        bottomBorderColor: line,
        bottomBorderStyle: 'thin' as const,
      })),
    )
    const notes = table.notes?.length
      ? [blank, ...table.notes.map((note) => [{ value: note, fontSize: 9, fontStyle: 'italic' as const, textColor: '#5b6272' }, ...blank.slice(1)])]
      : []
    const columns = table.headers.map((name, column) => ({
      width: Math.min(46, Math.max(column === 0 ? 24 : 14, ...[name, ...table.rows.map((row) => row[column])].map((cell) => String(cell ?? '').length + 3))),
    }))
    const data = [...heading, ...(heading.length ? [blank] : []), header, ...rows, ...notes]
    const blob = await writeXlsxFile([
      { data, sheet: table.sheet, columns, stickyRowsCount: heading.length + (heading.length ? 1 : 0) + 1, showGridLines: false },
    ]).toBlob()
    downloadImage(blob, fileName('xlsx'))
    return true
  } catch {
    return false
  }
}
