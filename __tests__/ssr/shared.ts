import Vue, { ComponentOptions } from 'vue'
import {
  createRouter as newRouter,
  createMemoryHistory,
  plugin,
} from '../../src'
import { components } from '../utils'

import { createRenderer } from 'vue-server-renderer'
import { RouterOptions } from '../../src/router'

Vue.use(plugin)

export const renderer = createRenderer()

export function createRouter(options?: Partial<RouterOptions>) {
  // TODO: a more complex routing that can be used for most tests
  return newRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/',
        component: components.Home,
      },
      {
        path: '/foo',
        component: components.Foo,
      },
    ],
    ...options,
  })
}

export function createApp(
  routerOptions?: Partial<RouterOptions>,
  options?: any
) {
  // create router instance
  const router = createRouter(routerOptions)

  const app = new Vue({
    // @ts-ignore
    router,
    template: `<div>
      <router-view/>
      </div>`,
    ...options,
    // render: h => h('div', {}, [h('RouterView')]),
  })

  // return both the app and the router
  return { app, router }
}

export function renderApp(
  context: { url: string },
  routerOptions?: Partial<RouterOptions>,
  vueOptions?: ComponentOptions<Vue>
) {
  return new Promise<ReturnType<typeof createApp>['app']>((resolve, reject) => {
    const { app, router } = createApp(routerOptions, vueOptions)

    // wait until router has resolved possible async components and hooks
    router.isReady().then(() => {
      // const matchedComponents = router.getMatchedComponents()
      const matchedComponents = router.currentRoute.matched
      // no matched routes, reject with 404
      if (!matchedComponents.length) {
        return reject({ code: 404 })
      }

      // the Promise should resolve to the app instance so it can be rendered
      resolve(app)
    }, reject)

    // set server-side router's location
    router.push(context.url).catch(err => {
      console.error('ssr push failed', err)
    })
  })
}
