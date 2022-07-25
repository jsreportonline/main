const init = require('../lib/init')
const should = require('should')

process.env = require('./basicOptions')

describe('multitenancyRepository', () => {
  let jsreport

  beforeEach(async () => {
    jsreport = await init()

    await Promise.all([
      jsreport.documentStore.provider.client.db(jsreport.options.db.databaseName).dropDatabase(),
      jsreport.documentStore.provider.client.db(jsreport.options.db.rootDatabaseName).dropDatabase()
    ])
  })

  afterEach(() => jsreport && jsreport.close())

  it('registerTenant should pass', async () => {
    await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')

    const tUser = await jsreport.multitenancyRepository.findTenantUser('test@test.com')

    tUser.name.should.be.eql('test@test.com')
    tUser.tenant.name.should.be.eql('test')
    tUser.tenant.email.should.be.eql('test@test.com')
    tUser.tenant.plan.should.be.eql('free')
    tUser.tenant.creditsAvailable.should.be.eql(200)
    tUser.tenant.creditsUsed.should.be.eql(0)
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

  it('findTenantByName should return clones', async () => {
    await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')

    const t = await jsreport.multitenancyRepository.findTenantByName('test')
    const t2 = await jsreport.multitenancyRepository.findTenantByName('test')

    t.name = 'foo'
    t2.name.should.not.be.eql('foo')
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

    const tUser = await jsreport.multitenancyRepository.findTenantUser('test@test.com')

    tUser.tenant.resetToken.should.be.eql(token)
  })

  it('findTenantUserInExtension', async () => {
    await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')

    await jsreport.documentStore.collection('users').insert({
      name: 'foo@foo.com',
      password: 'password',
      tenantId: 'test'
    })

    const tUser = await jsreport.multitenancyRepository.findTenantUserInExtension('foo@foo.com')

    tUser.name.should.be.eql('foo@foo.com')
    tUser.isAdmin.should.be.eql(false)
  })

  it('authenticateTenantInExtension', async () => {
    await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')

    await jsreport.documentStore.collection('users').insert({
      name: 'foo@foo.com',
      password: 'password',
      tenantId: 'test'
    })

    const t = await jsreport.multitenancyRepository.authenticateTenantInExtension('foo@foo.com', 'password')

    t.should.be.ok()
  })

  it('findTenantUser by custom user with the same name as subdomain', async () => {
    await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')

    await jsreport.documentStore.collection('users').insert({
      name: 'test',
      password: 'password',
      tenantId: 'test'
    })

    const tUser = await jsreport.multitenancyRepository.findTenantUser('test')

    tUser.name.should.be.eql('test')
    tUser.isAdmin.should.be.eql(false)
    tUser.tenant.name.should.be.eql('test')
  })

  it('findTenantUser should remove password from the output', async () => {
    await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')

    const tUser = await jsreport.multitenancyRepository.findTenantUser('test@test.com')

    should(tUser.password).not.be.ok()
    should(tUser.tenant.password).not.be.ok()
  })

  it('findTenantUser should return clones', async () => {
    await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')

    const tUser = await jsreport.multitenancyRepository.findTenantUser('test@test.com')
    const tUser2 = await jsreport.multitenancyRepository.findTenantUser('test@test.com')

    tUser.tenant.name = 'foo'
    tUser2.tenant.name.should.not.be.eql('foo')
  })

  it('update tenant should not be case sensitive', async () => {
    await jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password')

    await jsreport.multitenancyRepository.updateTenant('TEST', { $set: { plan: 'bronze' } })

    const tUser = await jsreport.multitenancyRepository.findTenantUser('test@test.com')

    tUser.tenant.plan.should.be.eql('bronze')
  })
})
