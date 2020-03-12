/**
 * @jest-environment jsdom
 */
import { Link as RouterLink } from '../src/components/Link'
import {
  START_LOCATION_NORMALIZED,
  RouteQueryAndHash,
  MatcherLocation,
  RouteLocationNormalized,
} from '../src/types'
import { createMemoryHistory } from '../src'
import { mount, tick } from './mount'
import { ref, markNonReactive } from 'vue'
import { RouteRecordNormalized } from '../src/matcher/types'

const records = {
  home: {} as RouteRecordNormalized,
  homeAlias: {} as RouteRecordNormalized,
  foo: {} as RouteRecordNormalized,
  parent: {} as RouteRecordNormalized,
  child: {} as RouteRecordNormalized,
  parentAlias: {} as RouteRecordNormalized,
  childAlias: {} as RouteRecordNormalized,
}

// fix the aliasOf
records.homeAlias = { aliasOf: records.home } as RouteRecordNormalized
records.parentAlias = { aliasOf: records.parent } as RouteRecordNormalized
records.childAlias = { aliasOf: records.child } as RouteRecordNormalized

const locations: Record<
  string,
  {
    string: string
    normalized: RouteLocationNormalized
    toResolve?: MatcherLocation & Required<RouteQueryAndHash>
  }
> = {
  basic: {
    string: '/home',
    // toResolve: { path: '/home', fullPath: '/home', undefined, query: {}, hash: '' },
    normalized: {
      fullPath: '/home',
      path: '/home',
      params: {},
      meta: {},
      query: {},
      hash: '',
      matched: [records.home],
      redirectedFrom: undefined,
      name: undefined,
    },
  },
  foo: {
    string: '/foo',
    // toResolve: { path: '/home', fullPath: '/home', undefined, query: {}, hash: '' },
    normalized: {
      fullPath: '/foo',
      path: '/foo',
      params: {},
      meta: {},
      query: {},
      hash: '',
      matched: [records.foo],
      redirectedFrom: undefined,
      name: undefined,
    },
  },
  withQuery: {
    string: '/home?foo=a&bar=b',
    // toResolve: { path: '/home', fullPath: '/home', undefined, query: {}, hash: '' },
    normalized: {
      fullPath: '/home?foo=a&bar=b',
      path: '/home',
      params: {},
      meta: {},
      query: { foo: 'a', bar: 'b' },
      hash: '',
      matched: [records.home],
      redirectedFrom: undefined,
      name: undefined,
    },
  },
  repeatedParams2: {
    string: '/p/1/2',
    normalized: {
      fullPath: '/p/1/2',
      path: '/p/1/2',
      params: { p: ['1', '2'] },
      meta: {},
      query: {},
      hash: '',
      matched: [records.home],
      redirectedFrom: undefined,
      name: undefined,
    },
  },
  repeatedParams3: {
    string: '/p/1/2/3',
    normalized: {
      fullPath: '/p/1/2/3',
      path: '/p/1/2/3',
      params: { p: ['1', '2', '3'] },
      meta: {},
      query: {},
      hash: '',
      matched: [records.home],
      redirectedFrom: undefined,
      name: undefined,
    },
  },
  alias: {
    string: '/alias',
    normalized: {
      fullPath: '/alias',
      path: '/alias',
      params: {},
      meta: {},
      query: {},
      hash: '',
      matched: [records.homeAlias],
      redirectedFrom: undefined,
      name: undefined,
    },
  },

  // nested routes
  parent: {
    string: '/parent',
    normalized: {
      fullPath: '/parent',
      path: '/parent',
      params: {},
      meta: {},
      query: {},
      hash: '',
      matched: [records.parent],
      redirectedFrom: undefined,
      name: undefined,
    },
  },
  parentAlias: {
    string: '/p',
    normalized: {
      fullPath: '/p',
      path: '/p',
      params: {},
      meta: {},
      query: {},
      hash: '',
      matched: [records.parentAlias],
      redirectedFrom: undefined,
      name: undefined,
    },
  },

  child: {
    string: '/parent/child',
    normalized: {
      fullPath: '/parent/child',
      path: '/parent/child',
      params: {},
      meta: {},
      query: {},
      hash: '',
      matched: [records.parent, records.child],
      redirectedFrom: undefined,
      name: undefined,
    },
  },
  childParentAlias: {
    string: '/p/child',
    normalized: {
      fullPath: '/p/child',
      path: '/p/child',
      params: {},
      meta: {},
      query: {},
      hash: '',
      matched: [records.parentAlias, records.child],
      redirectedFrom: undefined,
      name: undefined,
    },
  },
  childAlias: {
    string: '/parent/c',
    normalized: {
      fullPath: '/parent/c',
      path: '/parent/c',
      params: {},
      meta: {},
      query: {},
      hash: '',
      matched: [records.parent, records.childAlias],
      redirectedFrom: undefined,
      name: undefined,
    },
  },
  childDoubleAlias: {
    string: '/p/c',
    normalized: {
      fullPath: '/p/c',
      path: '/p/c',
      params: {},
      meta: {},
      query: {},
      hash: '',
      matched: [records.parentAlias, records.childAlias],
      redirectedFrom: undefined,
      name: undefined,
    },
  },
}

describe('RouterLink', () => {
  function factory(
    currentLocation: RouteLocationNormalized,
    propsData: any,
    resolvedLocation: RouteLocationNormalized,
    template: string = `<RouterLink :to="to">a link</RouterLink>`
  ) {
    const router = {
      history: createMemoryHistory(),
      createHref(to: RouteLocationNormalized): string {
        return this.history.base + to.fullPath
      },
      resolve: jest.fn(),
      push: jest.fn().mockResolvedValue(resolvedLocation),
      currentRoute: ref(markNonReactive(currentLocation)),
      setActiveApp: jest.fn(),
    }

    router.resolve.mockReturnValueOnce(resolvedLocation)
    const { app, el } = mount(router as any, {
      template,
      components: { RouterLink } as any,
      setup() {
        return { to: propsData.to }
      },
    })

    return { app, router, el }
  }

  it('displays a link with a string prop', () => {
    const { el } = factory(
      START_LOCATION_NORMALIZED,
      { to: locations.basic.string },
      locations.basic.normalized
    )
    expect(el.querySelector('a')!.getAttribute('href')).toBe('/home')
  })

  it('can change the value', async () => {
    const to = ref(locations.basic.string)
    const { el, router } = factory(
      START_LOCATION_NORMALIZED,
      { to },
      locations.basic.normalized
    )
    expect(el.querySelector('a')!.getAttribute('href')).toBe('/home')
    router.resolve.mockReturnValueOnce(locations.foo.normalized)
    to.value = locations.foo.string
    await tick()
    expect(el.querySelector('a')!.getAttribute('href')).toBe('/foo')
  })

  it('displays a link with an object with path prop', () => {
    const { el } = factory(
      START_LOCATION_NORMALIZED,
      { to: { path: locations.basic.string } },
      locations.basic.normalized
    )
    expect(el.querySelector('a')!.getAttribute('href')).toBe('/home')
  })

  it('can be active', () => {
    const { el } = factory(
      locations.basic.normalized,
      { to: locations.basic.string },
      locations.basic.normalized
    )
    expect(el.querySelector('a')!.className).toContain('router-link-active')
  })

  it('can be active with custom class', () => {
    const { el } = factory(
      locations.basic.normalized,
      { to: locations.basic.string },
      locations.basic.normalized,
      `<RouterLink class="nav-item" :to="to">a link</RouterLink>`
    )
    expect(el.querySelector('a')!.className).toContain('router-link-active')
    expect(el.querySelector('a')!.className).toContain('nav-item')
  })

  it('is not active with more repeated params', () => {
    const { el } = factory(
      locations.repeatedParams2.normalized,
      { to: locations.repeatedParams3.string },
      locations.repeatedParams3.normalized
    )
    expect(el.querySelector('a')!.className).toBe('')
  })

  it('is not active with partial repeated params', () => {
    const { el } = factory(
      locations.repeatedParams3.normalized,
      { to: locations.repeatedParams2.string },
      locations.repeatedParams2.normalized
    )
    expect(el.querySelector('a')!.className).toBe('')
  })

  it('can be active as an alias', () => {
    let { el } = factory(
      locations.basic.normalized,
      { to: locations.alias.string },
      locations.alias.normalized
    )
    expect(el.querySelector('a')!.className).toContain('router-link-active')
    expect(el.querySelector('a')!.className).toContain(
      'router-link-exact-active'
    )
    el = factory(
      locations.alias.normalized,
      { to: locations.basic.string },
      locations.basic.normalized
    ).el
    expect(el.querySelector('a')!.className).toContain('router-link-active')
    expect(el.querySelector('a')!.className).toContain(
      'router-link-exact-active'
    )
  })

  it('is active when a child is active', () => {
    const { el } = factory(
      locations.child.normalized,
      { to: locations.parent.string },
      locations.parent.normalized
    )
    expect(el.querySelector('a')!.className).toContain('router-link-active')
    expect(el.querySelector('a')!.className).not.toContain(
      'router-link-exact-active'
    )
  })

  it('only the children is exact-active', () => {
    const { el } = factory(
      locations.child.normalized,
      { to: locations.child.string },
      locations.child.normalized
    )
    expect(el.querySelector('a')!.className).toContain('router-link-active')
    expect(el.querySelector('a')!.className).toContain(
      'router-link-exact-active'
    )
  })

  it('child is not active if the parent is active', () => {
    const { el } = factory(
      locations.parent.normalized,
      { to: locations.child.string },
      locations.child.normalized
    )
    expect(el.querySelector('a')!.className).not.toContain('router-link-active')
    expect(el.querySelector('a')!.className).not.toContain(
      'router-link-exact-active'
    )
  })

  it('alias parent is active when a child is active', () => {
    let { el } = factory(
      locations.child.normalized,
      { to: locations.parentAlias.string },
      locations.parentAlias.normalized
    )
    expect(el.querySelector('a')!.className).toContain('router-link-active')
    expect(el.querySelector('a')!.className).not.toContain(
      'router-link-exact-active'
    )
    el = factory(
      locations.childDoubleAlias.normalized,
      { to: locations.parentAlias.string },
      locations.parentAlias.normalized
    ).el
    expect(el.querySelector('a')!.className).toContain('router-link-active')
    expect(el.querySelector('a')!.className).not.toContain(
      'router-link-exact-active'
    )
  })

  it('alias parent is active', () => {
    let { el } = factory(
      locations.parent.normalized,
      { to: locations.parentAlias.string },
      locations.parentAlias.normalized
    )
    expect(el.querySelector('a')!.className).toContain('router-link-active')
    expect(el.querySelector('a')!.className).toContain(
      'router-link-exact-active'
    )

    el = factory(
      locations.parentAlias.normalized,
      { to: locations.parent.string },
      locations.parent.normalized
    ).el
    expect(el.querySelector('a')!.className).toContain('router-link-active')
    expect(el.querySelector('a')!.className).toContain(
      'router-link-exact-active'
    )
  })

  it('child and parent with alias', () => {
    let { el } = factory(
      locations.child.normalized,
      { to: locations.childDoubleAlias.string },
      locations.childDoubleAlias.normalized
    )
    expect(el.querySelector('a')!.className).toContain('router-link-active')
    expect(el.querySelector('a')!.className).toContain(
      'router-link-exact-active'
    )

    el = factory(
      locations.child.normalized,
      { to: locations.childParentAlias.string },
      locations.childParentAlias.normalized
    ).el
    expect(el.querySelector('a')!.className).toContain('router-link-active')
    expect(el.querySelector('a')!.className).toContain(
      'router-link-exact-active'
    )
  })

  it('can be exact-active', () => {
    const { el } = factory(
      locations.basic.normalized,
      { to: locations.basic.string },
      locations.basic.normalized
    )
    expect(el.querySelector('a')!.className).toContain(
      'router-link-exact-active'
    )
  })

  it('calls ensureLocation', () => {
    const { router } = factory(
      START_LOCATION_NORMALIZED,
      { to: locations.basic.string },
      locations.basic.normalized
    )
    expect(router.resolve).toHaveBeenCalledTimes(1)
    expect(router.resolve).toHaveBeenCalledWith(locations.basic.string)
  })

  // TODO: call when we can test this
  it.skip('calls router.push when clicked', async () => {
    const { router, el } = factory(
      START_LOCATION_NORMALIZED,
      { to: locations.basic.string },
      locations.basic.normalized
    )
    el.click()
    await tick()
    expect(router.push).toHaveBeenCalledTimes(1)
    expect(router.push).toHaveBeenCalledWith(locations.basic.normalized)
  })

  describe('v-slot', () => {
    function factory(
      currentLocation: RouteLocationNormalized,
      propsData: any,
      resolvedLocation: RouteLocationNormalized
    ) {
      const router = {
        history: createMemoryHistory(),
        createHref(to: RouteLocationNormalized): string {
          return this.history.base + to.fullPath
        },
        resolve: jest.fn(),
        push: jest.fn().mockResolvedValue(resolvedLocation),
        currentRoute: ref(markNonReactive(currentLocation)),
        setActiveApp: jest.fn(),
      }

      router.resolve.mockReturnValueOnce(resolvedLocation)
      const { app, el } = mount(router as any, {
        template: `<RouterLink :to="to" v-slot="data">
        route: {{ JSON.stringify(data.route) }}
        href: "{{ data.href }}"
        isActive: "{{ data.isActive }}"
        isExactActive: "{{ data.isExactActive }}"
      </RouterLink>`,
        components: { RouterLink } as any,
        setup() {
          const to = ref(propsData.to)

          return { to }
        },
      })

      return { app, router, el }
    }

    it('provides information on v-slot', () => {
      const { el } = factory(
        locations.basic.normalized,
        { to: locations.basic.string },
        locations.basic.normalized
      )

      expect(el.innerHTML).toMatchSnapshot()
    })
  })
})
