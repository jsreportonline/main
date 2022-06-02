const init = require('../lib/init')
const Promise = require('bluebird')
require('should')

process.env = require('./basicOptions')

describe('reports', () => {
  let jsreport

  beforeEach(async () => {
    process.env.extensions.jo.reportsCleanupInterval = '500ms'
    jsreport = await init()

    await Promise.all([
      jsreport.documentStore.provider.client.db(jsreport.options.db.databaseName).dropDatabase(),
      jsreport.documentStore.provider.client.db(jsreport.options.db.rootDatabaseName).dropDatabase()
    ])
  })

  afterEach(() => {
    process.env.extensions.jo.reportsCleanupInterval = '1d'
    return jsreport.close()
  })

  it('should do autocleanup', async () => {
    const tenant = await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')
    const tenantUser = await jsreport.multitenancyRepository.findTenantUser('test@test.com')
    await jsreport.multitenancyRepository.updateTenant('test', { $set: { reportsCleanupTreshold: '10ms' } })

    await jsreport.render({
      template: {
        content: 'foo',
        engine: 'none',
        recipe: 'html'
      },
      options: {
        reports: { save: true }
      },
      context: { tenant, user: tenantUser }
    })

    await Promise.delay(1000)

    const count = await jsreport.documentStore.collection('reports').find({}).count()
    count.should.be.eql(0)
  })
})
