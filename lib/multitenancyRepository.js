const Promise = require('bluebird')
const validator = require('validator')
const passwordHash = require('password-hash')
const uuid = require('uuid').v1
const sample = require('./sample')
const nanoid = require('nanoid')
const extend = require('node.extend')

const cacheDuration = 5000

module.exports = class MultitenancyRepository {
  constructor (reporter) {
    this.reporter = reporter
    this._cacheAuthenticate = {}
    this._cacheFind = {}
    this._cacheFindName = {}
  }

  get db () {
    return this.reporter.documentStore.provider.client.db(this.reporter.options.db.rootDatabaseName || 'multitenant-root')
  }

  get tenants () {
    return this.db.collection('tenants')
  }

  get users () {
    return this.reporter.documentStore.provider.client.db(this.reporter.options.db.databaseName || 'multitenant').collection('users')
  }

  find (q) {
    return this.tenants.find(q).toArray()
  }

  findTenant (email) {
    const self = this

    if (this._cacheFind[email] && (new Date(this._cacheFind[email].time.getTime() + cacheDuration) > new Date())) {
      return this._cacheFind[email].tenantPromise.then((t) => extend(true, {}, t))
    }

    const promise = this.tenants.find({ email: new RegExp('^' + email + '$', 'i') }).toArray().then((res) => {
      if (res.length === 0) {
        return self.findTenantInExtension(email).then((t) => {
          if (!t) {
            delete self._cacheFind[email]
          }
          return t
        })
      }

      res[0].username = res[0].email
      res[0].isAdmin = true
      return res[0]
    }).then(function (tenant) {
      if (!tenant) {
        return tenant
      }

      delete tenant.password
      delete tenant.temporaryPassword
      // we still delete workerIp for legacy reasons,
      // just in case is still present in database record
      delete tenant.workerIp
      delete tenant.billingHistory

      return tenant
    }).catch((e) => {
      delete self._cacheFind[email]
      throw e
    })

    this._cacheFind[email] = {
      tenantPromise: promise,
      time: new Date()
    }

    return promise
  }

  findTenantByName (name, updateLogin) {
    const self = this

    name = name.toLowerCase()

    if (this._cacheFindName[name] && (new Date(this._cacheFindName[name].time.getTime() + cacheDuration) > new Date())) {
      return this._cacheFindName[name].tenantPromise.then((t) => extend(true, {}, t))
    }

    const promise = this.tenants.find({ name: new RegExp('^' + name + '$', 'i') }).toArray().then((res) => {
      if (res.length === 0) {
        throw new Error(`Tenant ${name}  not found`)
      }

      res[0].username = res[0].email
      res[0].isAdmin = true

      if (updateLogin === false) {
        return Promise.resolve(res[0])
      }

      return this.tenants.update({ name: res[0].name }, { $set: { lastLogin: new Date() } }).then(() => (res[0]))
    }).catch((e) => {
      delete self._cacheFindName[name]
      throw e
    })

    this._cacheFindName[name] = {
      tenantPromise: promise,
      time: new Date()
    }

    return promise
  }

  async findTenantInExtension (email) {
    const self = this

    const users = await this.users.find({
      username: new RegExp('^' + email + '$', 'i')
    }).toArray()

    if (users.length === 0) {
      return null
    }

    const tenant = await self.findTenantByName(users[0].tenantId)

    const user = Object.assign({}, tenant, users[0])

    user.email = users[0].username
    user.password = users[0].password
    user.isAdmin = false

    return user
  }

  async authenticateTenantInExtension (username, password) {
    const user = await this.findTenantInExtension(username)

    if (user === null) {
      return
    }

    if (passwordHash.verify(password, user.password)) {
      return user
    }

    return null
  }

  updateTenant (tenantName, tenantUpdate) {
    this._cacheFind = {}
    this._cacheFindName = {}

    return this.tenants.update({ name: new RegExp('^' + tenantName + '$', 'i') }, tenantUpdate)
  }

  update (q, u, o) {
    return this.tenants.update(q, u)
  }

  async generateResetToken (email) {
    const token = uuid()

    const op = await this.tenants.update({ email: email }, { $set: { resetToken: token } })

    // only resolve the token if there was a tenant found
    if (op && op.result.nModified > 0) {
      return token
    }

    return null
  }

  async resetPassword (token, password) {
    const self = this

    const tenants = await this.tenants.find({ resetToken: token }).toArray()

    if (tenants.length === 0) {
      return null
    }

    delete self._cacheAuthenticate[tenants[0].email]

    await self.tenants.update({ _id: tenants[0]._id }, { $set: { password: passwordHash.generate(password) } })

    const tenant = await self.authenticate(tenants[0].email, password)

    if (tenant) {
      await self.tenants.update({ _id: tenants[0]._id }, { $unset: { resetToken: '' } })
    }

    return tenant
  }

  async changePassword (tenant, oldPassword, newPassword) {
    const self = this

    const tenants = await this.tenants.find({ email: tenant.username }).toArray()

    if (tenants.length === 0) {
      throw new Error('Tenant not found')
    }

    if (!tenant.isAdmin) {
      throw new Error('Change password works only for main admins')
    }

    const tenantInDB = tenants[0]

    if (!passwordHash.verify(oldPassword, tenantInDB.password)) {
      return { code: `Password is not correct` }
    }

    if (newPassword.length < 4) {
      return { code: `Password is too short` }
    }

    delete self._cacheAuthenticate[tenant.username]

    await self.tenants.update({ _id: tenantInDB._id }, { $set: { password: passwordHash.generate(newPassword) } })

    return { code: 'ok' }
  }

  authenticate (username, password) {
    const self = this

    if (this._cacheAuthenticate[username] && (new Date(this._cacheAuthenticate[username].time.getTime() + cacheDuration) > new Date())) {
      return this._cacheAuthenticate[username].tenantPromise
    }

    const promise = this.tenants.find({ email: username }).toArray().then((res) => {
      if (res.length !== 0) {
        if (!passwordHash.verify(password, res[0].password) &&
          (!res[0].temporaryPassword || !passwordHash.verify(password, res[0].temporaryPassword) || (res[0].temporaryPasswordExpiration < new Date()))) {
          return null
        }

        res[0].isAdmin = true
        return res[0]
      }

      return self.authenticateTenantInExtension(username, password)
    }).then((tenant) => {
      if (!tenant) {
        return tenant
      }

      delete tenant.password
      delete tenant.temporaryPassword
      // we still delete workerIp for legacy reasons,
      // just in case is still present in database record
      delete tenant.workerIp
      delete tenant.billingHistory

      return tenant
    }).catch((e) => {
      delete self._cacheAuthenticate[username]
      throw e
    })

    this._cacheAuthenticate[username] = {
      tenantPromise: promise,
      time: new Date()
    }

    return promise
  }

  async registerContactEmail (tenant, contactEmail) {
    if (!tenant.isAdmin) {
      throw new Error('Register contact email works only for main admins')
    }

    if (!validator.isEmail(contactEmail)) {
      return { code: 'Not valid email' }
    }

    await this.tenants.update({ _id: tenant._id }, { $set: { contactEmail: contactEmail } })

    return { code: 'ok' }
  }

  async registerTenant (email, name, password) {
    const tenant = {
      email: email,
      password: passwordHash.generate(password),
      createdOn: new Date(),
      name: name,
      plan: 'free',
      creditsUsed: 0,
      creditsAvailable: 200,
      lastBilledDate: new Date()
    }

    await this.tenants.insert(tenant)
    await sample(this.reporter.documentStore, tenant)

    return Object.assign({}, tenant, { isAdmin: true, username: tenant.email })
  }

  async createTemporaryPassword (tenantName) {
    const password = nanoid(7)
    const configs = await this.db.collection('config').find({}).toArray()

    if (!configs || !configs.length || !configs[0].temporaryPasswordAllowed) {
      throw new Error('Temporary password not allowed')
    }

    await this.tenants.update({
      name: tenantName
    }, {
      $set: {
        temporaryPassword: passwordHash.generate(password),
        temporaryPasswordExpiration: new Date(new Date().getTime() + 120 * 60 * 1000)
      }
    })

    return password
  }

  async findMessage () {
    const res = await this.db.collection('config').find({}).toArray()

    if (res.length > 0) {
      return res[0].message
    }

    return null
  }
}
