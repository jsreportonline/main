const createRequest = require('jsreport-core').Request
const init = require('../lib/init')
const should = require('should')

process.env = require('./basicOptions')

describe('studio logs flush with discriminatorPath', () => {
  let reporter

  beforeEach(async () => {
    reporter = await init()

    await Promise.all([
      reporter.documentStore.provider.client.db(reporter.options.db.databaseName).dropDatabase(),
      reporter.documentStore.provider.client.db(reporter.options.db.rootDatabaseName).dropDatabase()
    ])
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
        tenant: {
          name: 'foo'
        }
      }
    })

    await Promise.delay(20)

    const requestsLog = await reporter.settings.findValue('requestsLog', createRequest({
      context: {
        tenant: {
          name: 'foo'
        }
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
        tenant: {
          name: 'foo'
        }
      }
    })

    await Promise.delay(20)

    const requestsLog = await reporter.settings.findValue('requestsLog', createRequest({
      context: {
        tenant: {
          name: 'foo2'
        }
      }
    }))
    should(requestsLog).be.null()
  })
})
