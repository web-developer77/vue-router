import { guardToPromiseFn } from '../../src/navigationGuards'
import { START_LOCATION_NORMALIZED } from '../../src/types'
import { ErrorTypes } from '../../src/errors'

// stub those two
const to = START_LOCATION_NORMALIZED
const from = {
  ...START_LOCATION_NORMALIZED,
  path: '/other',
  fullPath: '/other',
}

describe('guardToPromiseFn', () => {
  it('calls the guard with to, from and, next', async () => {
    const spy = jest.fn((to, from, next) => next())
    await expect(guardToPromiseFn(spy, to, from)()).resolves.toEqual(undefined)
    expect(spy).toHaveBeenCalledWith(to, from, expect.any(Function))
  })

  it('resolves if next is called with no arguments', async () => {
    await expect(
      guardToPromiseFn((to, from, next) => next(), to, from)()
    ).resolves.toEqual(undefined)
  })

  it('resolves if next is called with true', async () => {
    await expect(
      guardToPromiseFn((to, from, next) => next(true), to, from)()
    ).resolves.toEqual(undefined)
  })

  it('rejects if next is called with false', async () => {
    expect.assertions(1)
    try {
      await guardToPromiseFn((to, from, next) => next(false), to, from)()
    } catch (err) {
      expect(err).toMatchObject({
        from,
        to,
        type: ErrorTypes.NAVIGATION_ABORTED,
      })
    }
  })

  it('rejects if next is called with a string location', async () => {
    expect.assertions(1)
    try {
      await guardToPromiseFn((to, from, next) => next('/new'), to, from)()
    } catch (err) {
      expect(err).toMatchObject({
        from: to,
        to: '/new',
        type: ErrorTypes.NAVIGATION_GUARD_REDIRECT,
      })
    }
  })

  it('rejects if next is called with an object location', async () => {
    expect.assertions(1)
    let redirectTo = { path: '/new' }
    try {
      await guardToPromiseFn((to, from, next) => next(redirectTo), to, from)()
    } catch (err) {
      expect(err).toMatchObject({
        from: to,
        to: redirectTo,
        type: ErrorTypes.NAVIGATION_GUARD_REDIRECT,
      })
    }
  })

  it('rejects if next is called with an error', async () => {
    expect.assertions(1)
    let error = new Error('nope')
    try {
      await guardToPromiseFn((to, from, next) => next(error), to, from)()
    } catch (err) {
      expect(err).toBe(error)
    }
  })

  it('rejects if guard rejects a Promise', async () => {
    expect.assertions(1)
    let error = new Error('nope')
    try {
      await guardToPromiseFn(
        async (to, from, next) => {
          throw error
        },
        to,
        from
      )()
    } catch (err) {
      expect(err).toBe(error)
    }
  })

  it('rejects if guard throws an error', async () => {
    expect.assertions(1)
    let error = new Error('nope')
    try {
      await guardToPromiseFn(
        (to, from, next) => {
          throw error
        },
        to,
        from
      )()
    } catch (err) {
      expect(err).toBe(error)
    }
  })
})
