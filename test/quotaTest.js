const createRequest = require('jsreport-core/lib/render/request')
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
    let t = await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')

    const req = createRequest({
      template: {
        content: 'foo',
        engine: 'none',
        recipe: 'html'
      },
      context: {
        id: 1,
        user: t,
        tenant: t
      },
      options: {}
    })

    await jsreport.beforeRenderListeners.fire(req, {
      meta: {}
    })

    t = await jsreport.multitenancyRepository.findTenant('test@test.com')

    t.quotaUsed.should.be.eql(0)
    t.quotaStart.should.be.ok()
  })

  it('beforeRenderListeners should throw if quotaUsed exceeds', async () => {
    const t = await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')

    const req = createRequest({
      template: {
        content: 'foo',
        engine: 'none',
        recipe: 'html'
      },
      context: {
        id: 1,
        user: t,
        tenant: Object.assign(t, {
          quotaStart: new Date(),
          quotaUsed: 1000000
        })
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

    const req = createRequest({
      template: {
        content: 'foo',
        engine: 'none',
        recipe: 'html'
      },
      context: {
        id: 1,
        user: t,
        tenant: Object.assign(t, {
          quotaStart: new Date(new Date().getTime() - 60 * 10 * 1000),
          quotaUsed: 1000000
        })
      },
      options: {}
    })

    await jsreport.beforeRenderListeners.fire(req, {
      meta: {}
    })
  })
})
