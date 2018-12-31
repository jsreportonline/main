const init = require('../lib/init')
const Promise = require('bluebird')
require('should')

process.env = require('./basicOptions')

describe('entityCountLimit', () => {
  let jsreport

  beforeEach(async () => {
    jsreport = await init()

    await Promise.all([
      jsreport.documentStore.provider.client.db(jsreport.options.db.databaseName).dropDatabase(),
      jsreport.documentStore.provider.client.db(jsreport.options.db.rootDatabaseName).dropDatabase()
    ])
  })

  afterEach(() => jsreport.close())

  it('insert should pass if the limit is below', async () => {
    const t = await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')

    await jsreport.documentStore.collection('templates').insert({
      name: 'demo',
      content: 'foo',
      engine: 'none',
      recipe: 'html'
    }, {
      context: {
        tenant: { name: 'test' },
        user: { _id: t._id, username: 'test@test.com', admin: true }
      }
    })
  })

  it('insert should throw if limit set on tenant is reached', async () => {
    const createTemplate = (name, t) => {
      return jsreport.documentStore.collection('templates').insert({
        name,
        content: 'foo',
        engine: 'none',
        recipe: 'html'
      }, {
        context: {
          tenant: { name: 'test', entityCountLimit: 1 },
          user: { _id: t._id, username: 'test@test.com', admin: true }
        }
      })
    }

    const t = await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')

    try {
      await createTemplate('demo1', t)
      await createTemplate('demo2', t)
    } catch (e) {
      e.should.be.Error()
      e.message.should.match(/Maximum entity count limit reached/)
    }
  })

  it('insert should throw if limit set on plan is reached', async () => {
    const createTemplate = (name, t) => {
      return jsreport.documentStore.collection('templates').insert({
        name,
        content: 'foo',
        engine: 'none',
        recipe: 'html'
      }, {
        context: {
          tenant: { name: 'test', plan: 'free' },
          user: { _id: t._id, username: 'test@test.com', admin: true }
        }
      })
    }

    const t = await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')

    try {
      await Promise.mapSeries(Array(21), (i) => createTemplate('demo', t))
    } catch (e) {
      e.should.be.Error()
      e.message.should.match(/Maximum entity count limit reached/)
    }
  })

  it('insert should pass if limit set on plan is reached but entity is folders', async () => {
    const createFolder = (name, t) => {
      return jsreport.documentStore.collection('templates').insert({
        name
      }, {
        context: {
          tenant: { name: 'test', plan: 'free' },
          user: { _id: t._id, username: 'test@test.com', admin: true }
        }
      })
    }

    const t = await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')

    await Promise.mapSeries(Array(21), (i) => createFolder(`demo${i}`, t))
  })
})
