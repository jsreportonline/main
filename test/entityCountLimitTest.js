const init = require('../lib/init')
const Promise = require('bluebird')
require('should')

process.env = require('./basicOptions')

describe('entityCountLimit', () => {
  var jsreport

  beforeEach(() => {
    return init().then((j) => (jsreport = j)).then(() => {
      jsreport.documentStore.provider.db.db(jsreport.options.connectionString.databaseName).dropDatabase()
      jsreport.documentStore.provider.db.db(jsreport.options.connectionString.rootDatabaseName).dropDatabase()
    })
  })

  afterEach(() => jsreport.express.server.close())

  it('insert should pass if the limit is below', () => {
    return jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')
        .then((t) => jsreport.documentStore.collection('templates').insert({
          content: 'foo',
          engine: 'none',
          recipe: 'html'
        }, { tenant: { name: 'test' }, user: { _id: t._id, username: 'test@test.com', admin: true } }))
  })

  it('insert should throw if limit set on tenant is reached', () => {
    const createTemplate = (t) => {
      return jsreport.documentStore.collection('templates').insert({
        content: 'foo',
        engine: 'none',
        recipe: 'html'
      }, { tenant: { name: 'test', entityCountLimit: 1 }, user: { _id: t._id, username: 'test@test.com', admin: true } })
    }

    return jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')
        .then((t) => {
          return createTemplate(t).then(() => createTemplate(t))
        }).catch(() => 'validated').then((r) => r.should.be.eql('validated'))
  })

  it('insert should throw if limit set on plan is reached', () => {
    const createTemplate = (t) => {
      return jsreport.documentStore.collection('templates').insert({
        content: 'foo',
        engine: 'none',
        recipe: 'html'
      }, { tenant: { name: 'test', plan: 'free' }, user: { _id: t._id, username: 'test@test.com', admin: true } })
    }

    return jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')
        .then((t) => {
          return Promise.mapSeries(Array(21), (i) => createTemplate(t))
        }).catch(() => 'validated').then((r) => r.should.be.eql('validated'))
  })
})
