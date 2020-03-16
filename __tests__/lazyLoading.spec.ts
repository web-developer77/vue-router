import fakePromise from 'faked-promise'
import { createRouter, createMemoryHistory } from '../src'
import { RouterOptions } from '../src/router'
import { RouteComponent } from '../src/types'
import { ticks } from './utils'

function newRouter(options: Partial<RouterOptions> = {}) {
  let history = createMemoryHistory()
  const router = createRouter({ history, routes: [], ...options })

  return { history, router }
}

function createLazyComponent() {
  const [promise, resolve, reject] = fakePromise()

  return {
    component: jest.fn(() => promise.then(() => ({} as RouteComponent))),
    promise,
    resolve,
    reject,
  }
}

describe('Lazy Loading', () => {
  it('works', async () => {
    const { component, resolve } = createLazyComponent()
    const { router } = newRouter({
      routes: [{ path: '/foo', component }],
    })

    let p = router.push('/foo')
    await ticks(1)

    expect(component).toHaveBeenCalledTimes(1)
    resolve()

    await p
    expect(router.currentRoute.value).toMatchObject({
      path: '/foo',
      matched: [{}],
    })
  })

  it('works with nested routes', async () => {
    const parent = createLazyComponent()
    const child = createLazyComponent()
    const { router } = newRouter({
      routes: [
        {
          path: '/foo',
          component: parent.component,
          children: [{ path: 'bar', component: child.component }],
        },
      ],
    })

    parent.resolve()
    child.resolve()
    await router.push('/foo/bar')

    expect(parent.component).toHaveBeenCalled()
    expect(child.component).toHaveBeenCalled()

    expect(router.currentRoute.value).toMatchObject({
      path: '/foo/bar',
    })
    expect(router.currentRoute.value.matched).toHaveLength(2)
  })

  it('caches lazy loaded components', async () => {
    const { component, resolve } = createLazyComponent()
    const { router } = newRouter({
      routes: [
        { path: '/foo', component },
        { path: '/', component: {} },
      ],
    })

    resolve()

    await router.push('/foo')
    await router.push('/')
    await router.push('/foo')

    expect(component).toHaveBeenCalledTimes(1)
  })

  it('uses the same cache for aliases', async () => {
    const { component, resolve } = createLazyComponent()
    const { router } = newRouter({
      routes: [
        { path: '/foo', alias: ['/bar', '/baz'], component },
        { path: '/', component: {} },
      ],
    })

    resolve()

    await router.push('/foo')
    await router.push('/')
    await router.push('/bar')
    await router.push('/')
    await router.push('/baz')

    expect(component).toHaveBeenCalledTimes(1)
  })

  it('uses the same cache for nested aliases', async () => {
    const { component, resolve } = createLazyComponent()
    const c2 = createLazyComponent()
    const { router } = newRouter({
      routes: [
        {
          path: '/foo',
          alias: ['/bar', '/baz'],
          component,
          children: [
            { path: 'child', alias: ['c1', 'c2'], component: c2.component },
          ],
        },
        { path: '/', component: {} },
      ],
    })

    resolve()
    c2.resolve()

    await router.push('/baz/c2')
    await router.push('/')
    await router.push('/foo/c2')
    await router.push('/')
    await router.push('/foo/child')

    expect(component).toHaveBeenCalledTimes(1)
    expect(c2.component).toHaveBeenCalledTimes(1)
  })

  it('avoid fetching async component if navigation is cancelled through beforeEnter', async () => {
    const { component, resolve } = createLazyComponent()
    const spy = jest.fn((to, from, next) => next(false))
    const { router } = newRouter({
      routes: [
        {
          path: '/foo',
          component,
          beforeEnter: spy,
        },
      ],
    })

    resolve()
    await router.push('/foo').catch(() => {})
    expect(spy).toHaveBeenCalledTimes(1)
    expect(component).toHaveBeenCalledTimes(0)
  })

  it('avoid fetching async component if navigation is cancelled through router.beforeEach', async () => {
    const { component, resolve } = createLazyComponent()
    const { router } = newRouter({
      routes: [
        {
          path: '/foo',
          component,
        },
      ],
    })

    const spy = jest.fn((to, from, next) => next(false))

    router.beforeEach(spy)

    resolve()
    await router.push('/foo').catch(() => {})
    expect(spy).toHaveBeenCalledTimes(1)
    expect(component).toHaveBeenCalledTimes(0)
  })

  it('invokes beforeRouteEnter after lazy loading the component', async () => {
    const { promise, resolve } = createLazyComponent()
    const spy = jest.fn((to, from, next) => next())
    const component = jest.fn(() =>
      promise.then(() => ({ beforeRouteEnter: spy }))
    )
    const { router } = newRouter({
      routes: [{ path: '/foo', component }],
    })

    resolve()
    await router.push('/foo')
    expect(component).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('beforeRouteLeave works on a lazy loaded component', async () => {
    const { promise, resolve } = createLazyComponent()
    const spy = jest.fn((to, from, next) => next())
    const component = jest.fn(() =>
      promise.then(() => ({ beforeRouteLeave: spy }))
    )
    const { router } = newRouter({
      routes: [
        { path: '/foo', component },
        { path: '/', component: {} },
      ],
    })

    resolve()
    await router.push('/foo')
    expect(component).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledTimes(0)

    await router.push('/')
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('beforeRouteUpdate works on a lazy loaded component', async () => {
    const { promise, resolve } = createLazyComponent()
    const spy = jest.fn((to, from, next) => next())
    const component = jest.fn(() =>
      promise.then(() => ({ beforeRouteUpdate: spy }))
    )
    const { router } = newRouter({
      routes: [{ path: '/:id', component }],
    })

    resolve()
    await router.push('/foo')
    expect(component).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledTimes(0)

    await router.push('/bar')
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('aborts the navigation if async fails', async () => {
    const { component, reject } = createLazyComponent()
    const { router } = newRouter({
      routes: [{ path: '/foo', component }],
    })

    const spy = jest.fn()

    reject()
    await router.push('/foo').catch(spy)

    expect(spy).toHaveBeenCalled()

    expect(router.currentRoute.value).toMatchObject({
      path: '/',
      matched: [],
    })
  })

  it('aborts the navigation if nested async fails', async () => {
    const parent = createLazyComponent()
    const child = createLazyComponent()
    const { router } = newRouter({
      routes: [
        {
          path: '/foo',
          component: parent.component,
          children: [{ path: '', component: child.component }],
        },
      ],
    })

    const spy = jest.fn()

    parent.resolve()
    child.reject()
    await router.push('/foo').catch(spy)

    expect(spy).toHaveBeenCalledWith(expect.any(Error))

    expect(router.currentRoute.value).toMatchObject({
      path: '/',
      matched: [],
    })
  })
})
