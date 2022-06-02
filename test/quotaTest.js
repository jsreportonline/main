const createRequest = require('@jsreport/jsreport-core').Request
const init = require('../lib/init')
require('should')

process.env = require('./basicOptions')

describe('quota', () => {
  let jsreport

  beforeEach(async () => {
    jsreport = await init()

    await Promise.all([
      jsreport.documentStore.provider.client.db(jsreport.options.db.databaseName).dropDatabase(),
      jsreport.documentStore.provider.client.db(jsreport.options.db.rootDatabaseName).dropDatabase()
    ])
  })

  afterEach(() => jsreport.close())

  it('beforeRenderListeners should set quotaUsed and quotaStart', async () => {
    const t = await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')
    const tUser = await jsreport.multitenancyRepository.findTenantUser('test@test.com')

    const req = createRequest({
      template: {
        content: 'foo',
        engine: 'none',
        recipe: 'html'
      },
      context: {
        id: 1,
        user: tUser,
        tenant: t,
        profiling: {
          mode: 'disabled',
          entity: {}
        }
      },
      options: {}
    })

    await jsreport.beforeRenderListeners.fire(req, {
      meta: {}
    })

    const tenant = (await jsreport.multitenancyRepository.find({ email: 'test@test.com' }))[0]

    tenant.quotaUsed.should.be.eql(0)
    tenant.quotaStart.should.be.ok()
  })

  it('beforeRenderListeners should throw if quotaUsed exceeds', async () => {
    const t = await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')
    const tUser = await jsreport.multitenancyRepository.findTenantUser('test@test.com')

    const req = createRequest({
      template: {
        content: 'foo',
        engine: 'none',
        recipe: 'html'
      },
      context: {
        id: 1,
        user: tUser,
        tenant: Object.assign(t, {
          quotaStart: new Date(),
          quotaUsed: 1000000
        }),
        profiling: {
          mode: 'disabled',
          entity: {}
        }
      },
      options: {}
    })

    try {
      await jsreport.beforeRenderListeners.fire(req, {
        meta: {}
      })
    } catch (e) {
      e.should.be.Error()
      e.message.should.match(/Request quota exceeded/)
    }
  })

  it('beforeRenderListeners should not throw if quotaUsed exceeds but quotaStart long time before', async () => {
    const t = await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')
    const tUser = await jsreport.multitenancyRepository.findTenantUser('test@test.com')

    const req = createRequest({
      template: {
        content: 'foo',
        engine: 'none',
        recipe: 'html'
      },
      context: {
        id: 1,
        user: tUser,
        tenant: Object.assign(t, {
          quotaStart: new Date(new Date().getTime() - 60 * 10 * 1000),
          quotaUsed: 1000000
        }),
        profiling: {
          mode: 'disabled',
          entity: {}
        }
      },
      options: {}
    })

    await jsreport.beforeRenderListeners.fire(req, {
      meta: {}
    })
  })
})
