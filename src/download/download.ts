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

/** Save the chart (the element of `downloadConfig.imageTarget`) as PNG or JPEG. Returns false when it fails. */
export async function downloadChartImage(type: 'png' | 'jpeg'): Promise<boolean> {
  const target = document.querySelector<HTMLElement>(downloadConfig.imageTarget)
  if (!target) return false
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
