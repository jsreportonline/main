const init = require('../lib/init')
const passwordHash = require('password-hash')
const should = require('should')

process.env = require('./basicOptions')

describe('multitenancyRepository', () => {
  var jsreport

  beforeEach(() => {
    return init().then((j) => (jsreport = j)).then(() => {
      jsreport.documentStore.provider.db.db(jsreport.options.connectionString.databaseName).dropDatabase()
      jsreport.documentStore.provider.db.db(jsreport.options.connectionString.rootDatabaseName).dropDatabase()
    })
  })

  afterEach(() => jsreport.express.server.close())

  it('registerTenant should pass', () => {
    return jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password').then(() => {
      return jsreport.multitenancyRepository.findTenant('test@test.com').then((t) => {
        t.name.should.be.eql('test')
        t.email.should.be.eql('test@test.com')
        t.plan.should.be.eql('free')
        t.creditsAvailable.should.be.eql(200)
        t.creditsUsed.should.be.eql(0)
        passwordHash.verify(t.password, 'password').should.be.ok
      })
    })
  })

  it('findTenantByName', () => {
    return jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password').then(() => {
      return jsreport.multitenancyRepository.findTenantByName('test').then((t) => t.email.should.be.eql('test@test.com'))
    })
  })

  it('findTenantByName should not be case sensitive', () => {
    return jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password').then(() => {
      return jsreport.multitenancyRepository.findTenantByName('TEST').then((t) => t.email.should.be.eql('test@test.com'))
    })
  })

  it('authenticate should pass with correct credentials', () => {
    return jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password').then(() => {
      return jsreport.multitenancyRepository.authenticate('test@test.com', 'password')
    })
  })

  it('authenticate should return null with incorrect credentials', () => {
    return jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password').then(() => {
      return jsreport.multitenancyRepository.authenticate('test@test.com', 'foo')
        .then((v) => should(v).not.be.ok)
    })
  })

  it('generateResetToken', () => {
    return jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password').then((t) => {
      return jsreport.multitenancyRepository.generateResetToken('test@test.com').then((token) => {
        token.should.be.ok

        return jsreport.multitenancyRepository.findTenant('test@test.com').then((t) => t.resetToken.should.be.eql(token))
      })
    })
  })

  it('findTenantInExtension', () => {
    return jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password').then((t) => {
      return jsreport.documentStore.collection('users').insert({
        username: 'foo@foo.com',
        password: 'password',
        tenantId: 'test'
      }).then(() => {
        return jsreport.multitenancyRepository.findTenantInExtension('foo@foo.com').then((t) => {
          t.username.should.be.eql('foo@foo.com')
          t.isAdmin.should.be.eql(false)
        })
      })
    })
  })

  it('authenticateTenantInExtension', () => {
    return jsreport.multitenancyRepository.registerTenant('test@test.com', 'test', 'password').then((t) => {
      return jsreport.documentStore.collection('users').insert({
        username: 'foo@foo.com',
        password: 'password',
        tenantId: 'test'
      }).then(() => {
        return jsreport.multitenancyRepository.authenticateTenantInExtension('foo@foo.com', 'password').then((t) => t.should.be.ok)
      })
    })
  })
})