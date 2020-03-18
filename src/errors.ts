import {
  MatcherLocation,
  MatcherLocationNormalized,
  RouteLocation,
  RouteLocationNormalized,
} from './types'

export const enum ErrorTypes {
  MATCHER_NOT_FOUND,
  NAVIGATION_GUARD_REDIRECT,
  NAVIGATION_ABORTED,
  NAVIGATION_CANCELLED,
  // Using string enums because error codes are exposed to developers
  // and number enums could collide with other error codes in runtime
  // MATCHER_NOT_FOUND = 'MATCHER_NOT_FOUND',
  // NAVIGATION_GUARD_REDIRECT = 'NAVIGATION_GUARD_REDIRECT',
  // NAVIGATION_ABORTED = 'NAVIGATION_ABORTED',
  // NAVIGATION_CANCELLED = 'NAVIGATION_CANCELLED',
}

interface RouterErrorBase extends Error {
  type: ErrorTypes
}

export interface MatcherError extends RouterErrorBase {
  type: ErrorTypes.MATCHER_NOT_FOUND
  location: MatcherLocation
  currentLocation?: MatcherLocationNormalized
}

export interface NavigationError extends RouterErrorBase {
  type: ErrorTypes.NAVIGATION_ABORTED | ErrorTypes.NAVIGATION_CANCELLED
  from: RouteLocationNormalized
  to: RouteLocationNormalized
}

export interface NavigationRedirectError
  extends Omit<NavigationError, 'to' | 'type'> {
  type: ErrorTypes.NAVIGATION_GUARD_REDIRECT
  to: RouteLocation
}

// DEV only debug messages
const ErrorTypeMessages = {
  [ErrorTypes.MATCHER_NOT_FOUND]({ location, currentLocation }: MatcherError) {
    return `No match for\n ${JSON.stringify(location)}${
      currentLocation
        ? '\nwhile being at\n' + JSON.stringify(currentLocation)
        : ''
    }`
  },
  [ErrorTypes.NAVIGATION_GUARD_REDIRECT]({
    from,
    to,
  }: NavigationRedirectError) {
    return `Redirected from "${from.fullPath}" to "${stringifyRoute(
      to
    )}" via a navigation guard`
  },
  [ErrorTypes.NAVIGATION_ABORTED]({ from, to }: NavigationError) {
    return `Navigation aborted from "${from.fullPath}" to "${to.fullPath}" via a navigation guard`
  },
  [ErrorTypes.NAVIGATION_CANCELLED]({ from, to }: NavigationError) {
    return `Navigation cancelled from "${from.fullPath}" to "${to.fullPath}" with a new \`push\` or \`replace\``
  },
}

// Possible internal errors
type RouterError = NavigationError | NavigationRedirectError | MatcherError
// Public errors, TBD
//  export type PublicRouterError = NavigationError

export function createRouterError<E extends RouterError>(
  type: E['type'],
  params: Omit<E, 'type' | keyof Error>
): E {
  if (__DEV__ || !__BROWSER__) {
    return Object.assign(
      new Error(ErrorTypeMessages[type](params as any)),
      { type },
      params
    ) as E
  } else {
    return Object.assign(new Error(), { type }, params) as E
  }
}

const propertiesToLog = ['params', 'query', 'hash'] as const

function stringifyRoute(to: RouteLocation): string {
  if (typeof to === 'string') return to
  if ('path' in to) return to.path
  const location = {} as Record<string, unknown>
  for (const key of propertiesToLog) {
    if (key in to) location[key] = to[key]
  }
  return JSON.stringify(location, null, 2)
}
