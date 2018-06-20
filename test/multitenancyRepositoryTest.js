const init = require('../lib/init')
const should = require('should')

process.env = require('./basicOptions')

describe('multitenancyRepository', () => {
  let jsreport

  beforeEach(async () => {
    const j = await init()

    jsreport = j

    await Promise.all([
      jsreport.documentStore.provider.client.db(jsreport.options.db.databaseName).dropDatabase(),
      jsreport.documentStore.provider.client.db(jsreport.options.db.rootDatabaseName).dropDatabase()
    ])
  })

  afterEach(async () => {
    if (jsreport) {
      // NOTE: we are not calling .close because this calls mongoconnection.close() from jsreport-mongodb-store and causes
      // that tests throws Mongo error "Topology was destroyed", investigate this later
      // await jsreport.express.server.close()

      jsreport.express.server.close()
    }
  })

  it('registerTenant should pass', async () => {
    await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')

    const t = await jsreport.multitenancyRepository.findTenant('test@test.com')

    t.name.should.be.eql('test')
    t.email.should.be.eql('test@test.com')
    t.plan.should.be.eql('free')
    t.creditsAvailable.should.be.eql(200)
    t.creditsUsed.should.be.eql(0)
  })

  it('findTenantByName', async () => {
    await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')

    const t = await jsreport.multitenancyRepository.findTenantByName('test')

    t.email.should.be.eql('test@test.com')
  })

  it('findTenantByName should not be case sensitive', async () => {
    await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')

    const t = await jsreport.multitenancyRepository.findTenantByName('TEST')

    t.email.should.be.eql('test@test.com')
  })

  it('authenticate should pass with correct credentials', async () => {
    await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')
    await jsreport.multitenancyRepository.authenticate('test@test.com', 'password')
  })

  it('authenticate should return null with incorrect credentials', async () => {
    await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')

    const v = await jsreport.multitenancyRepository.authenticate('test@test.com', 'foo')

    should(v).not.be.ok()
  })

  it('authenticate should remove password from the output', async () => {
    await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')

    const v = await jsreport.multitenancyRepository.authenticate('test@test.com', 'password')

    should(v.password).not.be.ok()
  })

  it('generateResetToken', async () => {
    await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')

    const token = await jsreport.multitenancyRepository.generateResetToken('test@test.com')

    token.should.be.ok()

    const t = await jsreport.multitenancyRepository.findTenant('test@test.com')

    t.resetToken.should.be.eql(token)
  })

  it('findTenantInExtension', async () => {
    await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')

    await jsreport.documentStore.collection('users').insert({
      username: 'foo@foo.com',
      password: 'password',
      tenantId: 'test'
    })

    const t = await jsreport.multitenancyRepository.findTenantInExtension('foo@foo.com')

    t.username.should.be.eql('foo@foo.com')
    t.isAdmin.should.be.eql(false)
  })

  it('authenticateTenantInExtension', async () => {
    await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')

    await jsreport.documentStore.collection('users').insert({
      username: 'foo@foo.com',
      password: 'password',
      tenantId: 'test'
    })

    const t = await jsreport.multitenancyRepository.authenticateTenantInExtension('foo@foo.com', 'password')

    t.should.be.ok()
  })

  it('findTenant by curstom user with the same name as subdomain', async () => {
    await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')

    await jsreport.documentStore.collection('users').insert({
      username: 'test',
      password: 'password',
      tenantId: 'test'
    })

    const t = await jsreport.multitenancyRepository.findTenant('test')

    t.username.should.be.eql('test')
    t.isAdmin.should.be.eql(false)
  })

  it('findTenant should remove password from the output', async () => {
    await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')

    const v = await jsreport.multitenancyRepository.findTenant('test@test.com')

    should(v.password).not.be.ok()
  })

  it('update tenant should not be case sensitive', async () => {
    await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')

    await jsreport.multitenancyRepository.updateTenant('TEST', { $set: { plan: 'bronze' } })

    const v = await jsreport.multitenancyRepository.findTenant('test@test.com')

    v.plan.should.be.eql('bronze')
  })
})
