import { isBrowser } from '../utils'

interface HistoryLocation {
  fullPath: string
  state?: HistoryState
}

export type RawHistoryLocation = HistoryLocation | string
export type HistoryLocationNormalized = Pick<HistoryLocation, 'fullPath'>
// pushState clones the state passed and do not accept everything
// it doesn't accept symbols, nor functions as values. It also ignores Symbols as keys
type HistoryStateValue =
  | string
  | number
  | boolean
  | null
  | HistoryState
  | HistoryStateArray

export interface HistoryState {
  [x: number]: HistoryStateValue
  [x: string]: HistoryStateValue
}
interface HistoryStateArray extends Array<HistoryStateValue> {}

export enum NavigationType {
  pop = 'pop',
  push = 'push',
}

export enum NavigationDirection {
  back = 'back',
  forward = 'forward',
  unknown = '',
}

export interface NavigationInformation {
  type: NavigationType
  direction: NavigationDirection
  distance: number
}

export interface NavigationCallback {
  (
    to: HistoryLocationNormalized,
    from: HistoryLocationNormalized,
    information: NavigationInformation
  ): void
}

/**
 * Starting location for Histories
 */
const START_PATH = ''
export const START: HistoryLocationNormalized = {
  fullPath: START_PATH,
}

export type ValueContainer<T> = { value: T }

/**
 * Interface implemented by History implementations that can be passed to the
 * router as {@link Router.history}
 *
 * @alpha
 */
export interface RouterHistory {
  /**
   * Base path that is prepended to every url. This allows hosting an SPA at a
   * subfolder of a domain like `example.com/subfolder` by having a `base` of
   * `/subfolder`
   */
  readonly base: string
  /**
   * Current History location
   */
  readonly location: HistoryLocationNormalized
  /**
   * Current History state
   */
  readonly state: HistoryState
  // readonly location: ValueContainer<HistoryLocationNormalized>

  /**
   * Navigates to a location. In the case of an HTML5 History implementation,
   * this will call `history.pushState` to effectively change the URL.
   *
   * @param to - location to push
   * @param data - optional {@link HistoryState} to be associated with the
   * navigation entry
   */
  push(to: RawHistoryLocation, data?: HistoryState): void
  /**
   * Same as {@link RouterHistory.push} but performs a `history.replaceState`
   * instead of `history.pushState`
   *
   * @param to - location to set
   * @param data - optional {@link HistoryState} to be associated with the
   * navigation entry
   */
  replace(to: RawHistoryLocation, data?: HistoryState): void

  /**
   * Traverses history in a given direction.
   *
   * @example
   * ```js
   * myHistory.go(-1) // equivalent to window.history.back()
   * myHistory.go(1) // equivalent to window.history.forward()
   * ```
   *
   * @param distance - distance to travel. If distance is \< 0, it will go back,
   * if it's \> 0, it will go forward
   * @param triggerListeners - whether this should trigger listeners attached to
   * the history
   */
  go(distance: number, triggerListeners?: boolean): void

  /**
   * Attach a listener to the History implementation that is triggered when the
   * navigation is triggered from outside (like the Browser back and forward
   * buttons) or when passing `true` to {@link RouterHistory.back} and
   * {@link RouterHistory.forward}
   *
   * @param callback - listener to attach
   * @returns a callback to remove the listener
   */
  listen(callback: NavigationCallback): () => void
  destroy(): void
}

// Generic utils

export function normalizeHistoryLocation(
  location: RawHistoryLocation
): HistoryLocationNormalized {
  return {
    // to avoid doing a typeof or in that is quite long
    fullPath: (location as HistoryLocation).fullPath || (location as string),
  }
}

/**
 * Normalizes a base by removing any trailing slash and reading the base tag if
 * present.
 *
 * @param base base to normalize
 */
export function normalizeBase(base?: string): string {
  if (!base) {
    if (isBrowser) {
      // respect <base> tag
      const baseEl = document.querySelector('base')
      base = (baseEl && baseEl.getAttribute('href')) || '/'
      // strip full URL origin
      base = base.replace(/^\w+:\/\/[^\/]+/, '')
    } else {
      base = '/'
    }
  }

  // ensure leading slash when it was removed by the regex above avoid leading
  // slash with hash because the file could be read from the disk like file://
  // and the leading slash would cause problems
  if (base.charAt(0) !== '/' && base.charAt(0) !== '#') base = '/' + base

  // remove the trailing slash so all other method can just do `base + fullPath`
  // to build an href
  return base.replace(/\/$/, '')
}
