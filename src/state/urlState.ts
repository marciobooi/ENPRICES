import { useCallback, useEffect, useState } from 'react'

/**
 * The state of the tool lives in the address (`?unit=KWH&geo=BE,FR`): any link carries everything, so a shared
 * link, a bookmark and an embedded view (`?embed=...`) all show exactly what the person saw. There is no server
 * side "short link"; the address is the state.
 *
 * Describe each parameter once (see src/state/toolParams.ts) and read it with `useUrlState`.
 */
export interface ParamDefinition<T> {
  key: string
  fallback: T
  /** Turns the text from the address into a value; return undefined when it is not valid (the fallback is used). */
  parse: (raw: string) => T | undefined
  serialize: (value: T) => string
}

export type ParamSet<T> = { [K in keyof T]: ParamDefinition<T[K]> }

/** A text parameter, optionally limited to a list of allowed values. */
export function stringParam(key: string, fallback: string, allowed?: readonly string[]): ParamDefinition<string> {
  return {
    key,
    fallback,
    parse: (raw) => (!allowed || allowed.includes(raw) ? raw : undefined),
    serialize: (value) => value,
  }
}

/** A list parameter written as `a,b,c`, optionally limited to allowed values (unknown values are dropped). */
export function listParam(key: string, fallback: string[], allowed?: readonly string[]): ParamDefinition<string[]> {
  return {
    key,
    fallback,
    parse: (raw) => {
      const values = raw.split(',').filter((value) => value && (!allowed || allowed.includes(value)))
      return values.length > 0 ? values : undefined
    },
    serialize: (values) => values.join(','),
  }
}

export function readUrlState<T>(params: ParamSet<T>, search: string = window.location.search): T {
  const query = new URLSearchParams(search)
  const state = {} as T
  for (const name of Object.keys(params) as Array<keyof T>) {
    const definition = params[name]
    const raw = query.get(definition.key)
    state[name] = (raw === null ? undefined : definition.parse(raw)) ?? definition.fallback
  }
  return state
}

/** Write the state into the address without adding a history entry; other parameters (language, embed) stay. */
export function writeUrlState<T>(params: ParamSet<T>, state: T): void {
  const address = new URL(window.location.href)
  for (const name of Object.keys(params) as Array<keyof T>) {
    const definition = params[name]
    address.searchParams.set(definition.key, definition.serialize(state[name]))
  }
  window.history.replaceState(window.history.state, '', address)
}

/** State that starts from the address and keeps the address up to date. `params` must be a constant. */
export function useUrlState<T>(params: ParamSet<T>): readonly [T, (patch: Partial<T>) => void] {
  const [state, setState] = useState<T>(() => readUrlState(params))

  useEffect(() => {
    writeUrlState(params, state)
  }, [params, state])

  const update = useCallback((patch: Partial<T>) => setState((current) => ({ ...current, ...patch })), [])
  return [state, update]
}
