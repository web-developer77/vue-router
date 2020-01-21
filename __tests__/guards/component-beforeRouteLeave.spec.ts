import { RouterOptions, createRouter as newRouter } from '../../src/router'
import { NAVIGATION_TYPES, createDom, noGuard } from '../utils'
import { RouteRecord } from '../../src/types'
import { createHistory } from '../../src'

// TODO: refactor in utils
function createRouter(
  options: Partial<RouterOptions> & { routes: RouteRecord[] }
) {
  return newRouter({
    history: createHistory(),
    ...options,
  })
}

const Home = { template: `<div>Home</div>` }
const Foo = { template: `<div>Foo</div>` }

const nested = {
  parent: jest.fn(),
  nestedEmpty: jest.fn(),
  nestedA: jest.fn(),
  nestedB: jest.fn(),
  nestedAbs: jest.fn(),
  nestedNested: jest.fn(),
  nestedNestedFoo: jest.fn(),
  nestedNestedParam: jest.fn(),
}
const beforeRouteLeave = jest.fn()

const routes: RouteRecord[] = [
  { path: '/', component: Home },
  { path: '/foo', component: Foo },
  {
    path: '/guard',
    component: {
      ...Foo,
      beforeRouteLeave,
    },
  },
  {
    path: '/nested',
    component: {
      ...Home,
      beforeRouteLeave: nested.parent,
    },
    children: [
      {
        path: '',
        name: 'nested-empty-path',
        component: { ...Home, beforeRouteLeave: nested.nestedEmpty },
      },
      {
        path: 'a',
        name: 'nested-path',
        component: { ...Home, beforeRouteLeave: nested.nestedA },
      },
      {
        path: 'b',
        name: 'nested-path-b',
        component: { ...Home, beforeRouteLeave: nested.nestedB },
      },
      {
        path: '/abs-nested',
        name: 'absolute-nested',
        component: { ...Home, beforeRouteLeave: nested.nestedAbs },
      },
      {
        path: 'nested',
        name: 'nested-nested',
        component: { ...Home, beforeRouteLeave: nested.nestedNested },
        children: [
          {
            path: 'foo',
            name: 'nested-nested-foo',
            component: { ...Home, beforeRouteLeave: nested.nestedNestedFoo },
          },
          {
            path: 'param/:p',
            name: 'nested-nested-param',
            component: { ...Home, beforeRouteLeave: nested.nestedNestedParam },
          },
        ],
      },
    ],
  },
]

function resetMocks() {
  beforeRouteLeave.mockReset()
  for (const key in nested) {
    nested[key as keyof typeof nested].mockReset()
    nested[key as keyof typeof nested].mockImplementation(noGuard)
  }
}

beforeEach(() => {
  resetMocks()
})

describe('beforeRouteLeave', () => {
  beforeAll(() => {
    createDom()
  })

  NAVIGATION_TYPES.forEach(navigationMethod => {
    describe(navigationMethod, () => {
      it('calls beforeRouteLeave guard on navigation', async () => {
        const router = createRouter({ routes })
        beforeRouteLeave.mockImplementationOnce((to, from, next) => {
          if (to.path === 'foo') next(false)
          else next()
        })
        await router.push('/guard')
        expect(beforeRouteLeave).not.toHaveBeenCalled()

        await router[navigationMethod]('/foo')
        expect(beforeRouteLeave).toHaveBeenCalledTimes(1)
      })

      it('calls beforeRouteLeave guard on navigation between children', async () => {
        const router = createRouter({ routes })
        await router.push({ name: 'nested-path' })
        resetMocks()
        await router[navigationMethod]({ name: 'nested-path-b' })
        expect(nested.nestedEmpty).not.toHaveBeenCalled()
        expect(nested.nestedAbs).not.toHaveBeenCalled()
        expect(nested.nestedB).not.toHaveBeenCalled()
        expect(nested.nestedNestedFoo).not.toHaveBeenCalled()
        expect(nested.parent).not.toHaveBeenCalled()
        expect(nested.nestedNested).not.toHaveBeenCalled()
        expect(nested.nestedA).toHaveBeenCalledTimes(1)
        expect(nested.nestedA).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'nested-path-b',
            fullPath: '/nested/b',
          }),
          expect.objectContaining({
            name: 'nested-path',
            fullPath: '/nested/a',
          }),
          expect.any(Function)
        )
      })

      it('calls beforeRouteLeave guard on navigation between children in order', async () => {
        const router = createRouter({ routes })
        await router.push({ name: 'nested-nested-foo' })
        resetMocks()
        let count = 0
        nested.nestedNestedFoo.mockImplementation((to, from, next) => {
          expect(count++).toBe(0)
          next()
        })
        nested.nestedNested.mockImplementation((to, from, next) => {
          expect(count++).toBe(1)
          next()
        })
        nested.parent.mockImplementation((to, from, next) => {
          expect(count++).toBe(2)
          next()
        })

        await router[navigationMethod]('/')
        expect(nested.parent).toHaveBeenCalledTimes(1)
        expect(nested.nestedNested).toHaveBeenCalledTimes(1)
        expect(nested.nestedNestedFoo).toHaveBeenCalledTimes(1)
      })

      // TODO: implem async components
      it.skip('works when a lazy loaded component', async () => {
        const router = createRouter({
          routes: [
            ...routes,
            {
              path: '/lazy',
              component: () => Promise.resolve({ ...Foo, beforeRouteLeave }),
            },
          ],
        })
        beforeRouteLeave.mockImplementationOnce((to, from, next) => {
          next()
        })
        await router.push('/lazy')
        expect(beforeRouteLeave).not.toHaveBeenCalled()
        await router[navigationMethod]('/foo')
        expect(beforeRouteLeave).toHaveBeenCalledTimes(1)
      })

      it('can cancel navigation', async () => {
        const router = createRouter({ routes })
        beforeRouteLeave.mockImplementationOnce(async (to, from, next) => {
          next(false)
        })
        await router.push('/guard')
        const p = router[navigationMethod]('/')
        const currentRoute = router.currentRoute.value
        expect(currentRoute.fullPath).toBe('/guard')
        await p.catch(err => {}) // catch the navigation abortion
        expect(currentRoute.fullPath).toBe('/guard')
      })
    })
  })
})
