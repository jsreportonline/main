const init = require('../lib/init')
require('should')

process.env = require('./basicOptions')

describe('creditsLimit', () => {
  let jsreport

  beforeEach(async () => {
    jsreport = await init()

    await Promise.all([
      jsreport.documentStore.provider.client.db(jsreport.options.db.databaseName).dropDatabase(),
      jsreport.documentStore.provider.client.db(jsreport.options.db.rootDatabaseName).dropDatabase()
    ])
  })

  afterEach(() => jsreport && jsreport.close())

  it('report should update credits', async () => {
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

    tenant.creditsUsed.should.be.greaterThan(0)
  })

  it('report should be rejected when creditsUsed over limit', async () => {
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
        tenant: {
          ...t,
          creditsUsed: t.creditsAvailable * 10 * 1000
        }
      }
    }).should.be.rejectedWith(/Maximum excess of credits allowed for your plan reached/)
  })

  it('report trigger email send if credits used excess', async () => {
    const t = await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')
    const tUser = await jsreport.multitenancyRepository.findTenantUser('test@test.com')

    let email
    jsreport.mailer = (e) => { email = e }

    await jsreport.render({
      template: {
        content: 'foo',
        engine: 'none',
        recipe: 'html'
      },
      context: {
        user: tUser,
        tenant: {
          ...t,
          creditsUsed: t.creditsAvailable * 1000 * 1.1
        }
      }
    })
    email.subject.should.be.eql('jsreportonline credits limit has been exceeded')
  })
})
