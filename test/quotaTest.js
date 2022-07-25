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

  it('report should set quotaUsed and quotaStart', async () => {
    const start = new Date()
    const t = await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')
    const tUser = await jsreport.multitenancyRepository.findTenantUser('test@test.com')

    await jsreport.render({
      template: {
        content: 'foo',
        engine: 'none',
        recipe: 'html'
      },
      context: {
        user: tUser,
        tenant: t
      }
    })

    const tenant = (await jsreport.multitenancyRepository.find({ email: 'test@test.com' }))[0]

    tenant.quotaUsed.should.be.greaterThan(0)
    tenant.quotaStart.should.be.greaterThan(start)
  })

  it('report should throw if quotaUsed exceeds', async () => {
    const t = await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')
    const tUser = await jsreport.multitenancyRepository.findTenantUser('test@test.com')

    return jsreport.render({
      template: {
        content: 'foo',
        engine: 'none',
        recipe: 'html'
      },
      context: {
        user: tUser,
        tenant: Object.assign(t, {
          quotaStart: new Date(),
          quotaUsed: 1000000
        })
      }
    }).should.be.rejectedWith(/Request quota exceeded/)
  })

  it('report should not throw if quotaUsed exceeds but quotaStart long time before', async () => {
    const t = await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')
    const tUser = await jsreport.multitenancyRepository.findTenantUser('test@test.com')

    await jsreport.render({
      template: {
        content: 'foo',
        engine: 'none',
        recipe: 'html'
      },
      context: {
        user: tUser,
        tenant: Object.assign(t, {
          quotaStart: new Date(new Date().getTime() - 60 * 10 * 1000),
          quotaUsed: 1000000
        })
      }
    })
  })
})
