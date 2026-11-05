/**
 * Links made by the previous ENPRICES tool (`?geos=BE,FR&detail=1&component=0&order=DESC&percentage=0&language=EN...`)
 * keep working: they are rewritten to the parameters of this tool before anything reads the address.
 * The addresses people shared or bookmarked years ago therefore open the same view.
 */
const LEGACY_KEYS = ['geos', 'detail', 'consoms', 'taxs', 'chartInDetails', 'chartId', 'nrg_prc', 'share']

const ORDERS: Record<string, string> = { DESC: 'desc', ASC: 'asc', ALPHA: 'alfa', PROTO: 'proto' }
const DRILL_VIEWS: Record<string, string> = { barChart: 'bar', pieChart: 'pie', lineChart: 'line' }

export function migrateLegacyUrl(address: URL): boolean {
  const query = address.searchParams
  const isLegacy = LEGACY_KEYS.some((key) => query.has(key))
    || ['0', '1'].includes(query.get('component') ?? '')
    || (query.get('percentage') === '0' || query.get('percentage') === '1')
    || ((query.get('order') ?? '') in ORDERS)
  if (!isLegacy) return false

  const move = (from: string, to: string) => {
    const value = query.get(from)
    if (value !== null && value !== '' && value !== 'undefined') query.set(to, value)
    query.delete(from)
  }

  move('geos', 'geo')
  move('consoms', 'band')

  const detail = query.get('detail') === '1' || query.get('chartInDetails') === '1'
  query.delete('detail')
  query.delete('chartInDetails')
  if (detail) query.set('breakdown', 'components')

  const component = query.get('component')
  if (component === '0' || component === '1') query.set('component', component === '1' ? 'components' : 'total')

  const order = query.get('order')
  if (order && order in ORDERS) query.set('order', ORDERS[order])

  const percentage = query.get('percentage')
  if (percentage === '0' || percentage === '1') query.set('percentage', percentage === '1' ? 'percentage' : 'value')

  const language = query.get('language')
  if (language) query.set('language', language.toLowerCase())

  const view = DRILL_VIEWS[query.get('chartId') ?? '']
  if (view && query.get('chartGeo')) query.set('chartView', view)
  query.delete('chartId')

  // An old "share" link was the iframe version of the tool.
  if (query.get('share') === 'true') query.set('embed', 'main')
  query.delete('share')

  for (const key of ['taxs', 'nrg_prc', 'dataset', 'currency']) query.delete(key)
  if (query.get('chartGeo') === '') query.delete('chartGeo')
  return true
}

/** Rewrite the address in place (no history entry) if it is an old-style link. */
export function applyLegacyUrl(): void {
  const address = new URL(window.location.href)
  if (migrateLegacyUrl(address)) window.history.replaceState(window.history.state, '', address)
}

applyLegacyUrl()
