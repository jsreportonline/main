var passwordHash = require('password-hash')

module.exports = class MultitenancyRepository {
  constructor (reporter) {
    this.reporter = reporter
  }

  get db () {
    return this.reporter.documentStore.provider.db.db('multitenant-root')
  }

  get tenants () {
    return this.db.collection('tenants')
  }

  findTenant (email) {
    return this.tenants.find({ email: email }).toArray().then((res) => {
      if (res.length < 1) {
        throw new Error(`Tenant ${email} + ' not found`)
      }

      return res[0]
    })
  }

  findTenantByName (name) {
    return this.tenants.find({ name: name }).toArray().then((res) => {
      if (res.length < 1) {
        throw new Error(`Tenant ${name} + ' not found`)
      }

      return res[0]
    })
  }

  authenticate (username, password) {
    return this.tenants.find({ email: username }).toArray().then((res) => {
      if (res.length === 1) {
        return res[0]
      }

      return null
    })
  }

  registerTenant (email, name, password) {
    var tenant = {
      email: email,
      password: passwordHash.generate(password),
      createdOn: new Date(),
      name: name,
      creditsUsed: 0,
      creditsBilled: 0,
      creditsAvailable: 200,
      lastBilledDate: new Date()
    }

    return this.tenants.insert(tenant).then(() => tenant)
  }
}