import axios, { type AxiosRequestConfig } from 'axios'

const EUROSTAT_API_URL = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data'

export interface JsonStatDataset {
  id: string[]
  size: number[]
  dimension: Record<string, {
    category: {
      /** JSON-stat allows an id -> position map or an ordered array of ids. */
      index: Record<string, number> | string[]
      label?: Record<string, string>
    }
  }>
  value?: Record<string, number | null> | Array<number | null>
  /** Data-quality flags ("p" provisional, "e" estimated), by position like `value`. */
  status?: Record<string, string> | Array<string | null>
}

export interface TimeSeriesPoint {
  period: string
  value: number
}

export const eurostatApi = axios.create({
  baseURL: EUROSTAT_API_URL,
  timeout: 30_000,
  headers: { Accept: 'application/json' },
  // Eurostat filters repeat the key (geo=BE&geo=FR); axios' default would send geo[]=BE&geo[]=FR.
  paramsSerializer: { indexes: null },
})

export async function fetchEurostatDataset(
  datasetCode: string,
  params: Record<string, string | number | boolean | Array<string | number>> = {},
  config: Pick<AxiosRequestConfig, 'signal'> = {},
): Promise<JsonStatDataset> {
  if (!/^[a-zA-Z0-9_]+$/.test(datasetCode)) {
    throw new TypeError('Eurostat dataset codes may only contain letters, numbers and underscores.')
  }

  try {
    const response = await eurostatApi.get<JsonStatDataset>(
      `/${encodeURIComponent(datasetCode)}`,
      { params, ...config },
    )
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      throw new Error(
        `Eurostat API request failed${status ? ` with HTTP ${status}` : ''}: ${error.message}`,
        { cause: error },
      )
    }
    throw error
  }
}

/**
 * Convert a JSON-stat dataset to chart points along `dimensionId` (default `time`).
 * Every other dimension must have exactly one category: filter the request (geo, unit, ...) first.
 */
export function getTimeSeries(dataset: JsonStatDataset, dimensionId = 'time'): TimeSeriesPoint[] {
  const timeDimensionIndex = dataset.id.indexOf(dimensionId)
  const timeIndex = dataset.dimension[dimensionId]?.category.index
  const values = dataset.value

  if (timeDimensionIndex < 0 || !timeIndex || !values || dataset.id.length !== dataset.size.length) {
    return []
  }

  const ambiguous = dataset.id.filter((_id, index) => index !== timeDimensionIndex && dataset.size[index] > 1)
  if (ambiguous.length > 0) {
    throw new Error(
      `The dataset has several categories in ${ambiguous.join(', ')}: add a filter for each so only one series remains.`,
    )
  }

  // id -> position, whether the index is a map or an ordered array of ids
  const periods: Array<[string, number]> = Array.isArray(timeIndex)
    ? timeIndex.map((id, position) => [id, position])
    : Object.entries(timeIndex)
  periods.sort(([, left], [, right]) => left - right)

  return periods.flatMap(([period, position]) => {
    // all other dimensions have size 1, so the flat index is the position along the time dimension
    const value = Array.isArray(values) ? values[position] : values[String(position)]
    return typeof value === 'number' && Number.isFinite(value) ? [{ period, value }] : []
  })
}
