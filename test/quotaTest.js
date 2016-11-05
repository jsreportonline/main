const init = require('../lib/init')
const path = require('path')
const should = require('should')
const winston = require('winston')

process.env = require('./basicOptions')

describe('quota', () => {
  var jsreport

  beforeEach(() => {
    return init().then((j) => (jsreport = j)).then(() => {
      jsreport.documentStore.provider.db.db(jsreport.options.connectionString.databaseName).dropDatabase()
      jsreport.documentStore.provider.db.db(jsreport.options.connectionString.rootDatabaseName).dropDatabase()
    })
  })

  afterEach(() => jsreport.express.server.close())

  it('beforeRenderListeners should set quotaUsed and quotaStart', () => {
    return jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password').then((t) => {
      return jsreport.beforeRenderListeners.fire({
        logger: new (winston.Logger)(),
        template: {
          content: 'foo',
          engine: 'none',
          recipe: 'html'
        },
        user: t,
        tenant: t,
        options: {},
        headers: {}
      })
    }).then(() => jsreport.multitenancyRepository.findTenant('test@test.com').then((t) => {
      t.quotaUsed.should.be.eql(0)
      t.quotaStart.should.be.ok
    }))
  })

  it('beforeRenderListeners should throw if quotaUsed exceeds', () => {
    return jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')
      .then((t) => jsreport.beforeRenderListeners.fire({
        logger: new (winston.Logger)(),
        template: {
          content: 'foo',
          engine: 'none',
          recipe: 'html'
        },
        user: t,
        tenant: Object.assign(t, {
          quotaStart: new Date(),
          quotaUsed: 1000000
        }),
        options: {},
        headers: {}
      })).catch(() => 'failed').then((m) => m.should.be.eql('failed'))
  })

  it('beforeRenderListeners should not throw quotaUsed exceeds but quotaStart long time before', () => {
    return jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')
      .then((t) => jsreport.beforeRenderListeners.fire({
        logger: new (winston.Logger)(),
        template: {
          content: 'foo',
          engine: 'none',
          recipe: 'html'
        },
        user: t,
        tenant: Object.assign(t, {
          quotaStart: new Date(new Date().getTime() - 60 * 10 * 1000),
          quotaUsed: 1000000
        }),
        options: {},
        headers: {}
      }))
  })
})
