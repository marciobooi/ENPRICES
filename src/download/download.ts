import { downloadConfig } from '../config/toolConfig'
import { captureElement, downloadImage } from '../share/screenshot'

export type DownloadFormat = (typeof downloadConfig.formats)[number]

/** The data of the chart as a table: what the Excel file contains. */
export interface DownloadTable {
  /** Name of the worksheet. */
  sheet: string
  headers: string[]
  rows: (string | number)[][]
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
    const height = 32
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
      const footerHeight = logo ? logo.height + 24 : 0
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
              load(this: { renderer: { image: (src: string, x: number, y: number, w: number, h: number) => { add: () => void } }; chartHeight: number }) {
                if (logo) this.renderer.image(logo.src, 10, this.chartHeight - logo.height - 10, logo.width, logo.height).add()
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
    const header = table.headers.map((value) => ({ value, fontWeight: 'bold' as const }))
    const rows = table.rows.map((row) => row.map((value) => ({ value })))
    const blob = await writeXlsxFile([{ data: [header, ...rows], sheet: table.sheet }]).toBlob()
    downloadImage(blob, fileName('xlsx'))
    return true
  } catch {
    return false
  }
}
