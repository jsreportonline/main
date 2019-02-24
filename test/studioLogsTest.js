const Promise = require('bluebird')
const createRequest = require('jsreport-core').Request
const init = require('../lib/init')
const should = require('should')

process.env = require('./basicOptions')
process.env.extensions = process.env.extensions || {}
process.env.extensions.studio = process.env.extensions.studio || {}
process.env.extensions.studio.flushLogsInterval = 100

describe.skip('studio logs flush with discriminatorPath', () => {
  let reporter
  let testTenant
  let test2Tenant

  beforeEach(async () => {
    reporter = await init()

    await Promise.all([
      reporter.documentStore.provider.client.db(reporter.options.db.databaseName).dropDatabase(),
      reporter.documentStore.provider.client.db(reporter.options.db.rootDatabaseName).dropDatabase()
    ])

    testTenant = await reporter.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')
    test2Tenant = await reporter.multitenancyRepository.registerTenant('test2@test2.com', 'test2', 'password')
  })

  afterEach(async () => {
    if (reporter) {
      await reporter.close()
    }
  })

  it('render templates should persist logs to settings based on requestLogDiscriminatorPath', async () => {
    await reporter.render({
      template: {
        content: 'foo',
        engine: 'none',
        recipe: 'html'
      },
      context: {
        tenant: testTenant
      }
    })

    await Promise.delay(1000)

    const requestsLog = await reporter.settings.findValue('requestsLog', createRequest({
      context: {
        tenant: testTenant
      }
    }))

    requestsLog.should.have.length(1)
    requestsLog[0].logs.length.should.be.greaterThan(0)
  })

  it('render templates should persist logs to settings based on requestLogDiscriminatorPath (negative)', async () => {
    await reporter.render({
      template: {
        content: 'foo',
        engine: 'none',
        recipe: 'html'
      },
      context: {
        tenant: testTenant
      }
    })

    await Promise.delay(1000)

    const requestsLog = await reporter.settings.findValue('requestsLog', createRequest({
      context: {
        tenant: test2Tenant
      }
    }))

    should(requestsLog).be.null()
  })
})
