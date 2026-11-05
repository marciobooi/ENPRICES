/** Elements that must not appear in a screenshot (the share popover itself, the tour overlay). */
function isExcluded(element: Element): boolean {
  return element.id === 'share-popover' || element.id === 'download-popover' || element.classList.contains('driver-overlay')
}

/** Image of one element (a chart) as PNG or JPEG, at up to 2x resolution. Returns null when the capture fails. */
export async function captureElement(element: HTMLElement, type: 'image/png' | 'image/jpeg'): Promise<Blob | null> {
  try {
    const { default: html2canvas } = await import('html2canvas-pro')
    const canvas = await html2canvas(element, {
      // JPEG has no transparency: always paint a white background.
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      scale: Math.min(window.devicePixelRatio || 1, 2),
      ignoreElements: isExcluded,
    })
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.92))
  } catch {
    return null
  }
}

/**
 * Screenshot of what the user currently sees (the visible window, not the whole page) as a PNG.
 * The library is loaded on demand, so it costs nothing until someone uses it. Returns null when the capture fails.
 */
export async function captureViewport(): Promise<Blob | null> {
  try {
    const { default: html2canvas } = await import('html2canvas-pro')
    const canvas = await html2canvas(document.documentElement, {
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      x: window.scrollX,
      y: window.scrollY,
      width: window.innerWidth,
      height: window.innerHeight,
      scale: Math.min(window.devicePixelRatio || 1, 2),
      ignoreElements: isExcluded,
    })
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  } catch {
    return null
  }
}

/** Put an image on the clipboard (Outlook and most mail clients paste it straight into the message). */
export async function copyImageToClipboard(image: Blob): Promise<boolean> {
  try {
    await navigator.clipboard.write([new ClipboardItem({ [image.type]: image })])
    return true
  } catch {
    return false
  }
}

/** Save an image as a file, for when the clipboard is not available. */
export function downloadImage(image: Blob, filename: string): void {
  const address = URL.createObjectURL(image)
  const link = document.createElement('a')
  link.href = address
  link.download = filename
  // Attached to the page and released later: some browsers cancel the save if the link or address goes away at once.
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  setTimeout(() => {
    link.remove()
    URL.revokeObjectURL(address)
  }, 10000)
}
