import { useEffect, useState } from 'react'

/**
 * Height of the app's own content. #root is at least one viewport tall, so its scrollHeight only exceeds the
 * window when the content really is taller; banners injected outside #root (Webtools notices) do not count.
 */
function contentHeight(): number {
  return document.getElementById('root')?.scrollHeight ?? document.documentElement.scrollHeight
}

/**
 * True while the page content is taller than the window, i.e. while a "back to top" shortcut is useful.
 * Re-measured on window resize (zoom, rotation) and whenever the content changes height
 * (data loaded, menu opened, language switched), so it works for every page of the tool.
 */
export function useNeedsScroll(): boolean {
  const [needsScroll, setNeedsScroll] = useState(false)

  useEffect(() => {
    const measure = () => setNeedsScroll(contentHeight() > window.innerHeight)
    measure()

    const observer = new ResizeObserver(measure)
    const root = document.getElementById('root')
    if (root) {
      observer.observe(root)
      Array.from(root.children).forEach((child) => observer.observe(child))
    }
    window.addEventListener('resize', measure)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  return needsScroll
}
