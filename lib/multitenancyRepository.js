const { nanoid } = require('nanoid')
const extend = require('node.extend.without.arrays')
const omit = require('lodash.omit')
const validator = require('validator')
const passwordHash = require('password-hash')
const uuid = require('uuid').v1
const convertToObjectId = require('./convertToObjectId')
const sample = require('./sample')

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

  find (q, o) {
    if (q && q._id) {
      q._id = convertToObjectId(q._id)
    }

    return this.tenants.find(q, o).toArray()
  }

  findTenantUser (emailOrUsername) {
    const self = this

    if (this._cacheFind[emailOrUsername] && (new Date(this._cacheFind[emailOrUsername].time.getTime() + cacheDuration) > new Date())) {
      return this._cacheFind[emailOrUsername].tenantPromise.then((t) => extend(true, {}, t))
    }

    const promise = this.tenants.find({ email: new RegExp('^' + emailOrUsername + '$', 'i') }).toArray().then((res) => {
      if (res.length === 0) {
        return self.findTenantUserInExtension(emailOrUsername).then((t) => {
          if (!t) {
            delete self._cacheFind[emailOrUsername]
          }
          return t
        })
      }

      return {
        _id: res[0]._id,
        name: res[0].email,
        password: res[0].password,
        adminEmail: res[0].email,
        isAdmin: true,
        tenant: res[0]
      }
    }).then(function (tenantUser) {
      if (!tenantUser) {
        return tenantUser
      }

      delete tenantUser.password
      delete tenantUser.tenant.password
      delete tenantUser.tenant.temporaryPassword
      // we still delete workerIp for legacy reasons,
      // just in case is still present in database record
      delete tenantUser.tenant.workerIp

      return tenantUser
    }).catch((e) => {
      delete self._cacheFind[emailOrUsername]
      throw e
    })

    this._cacheFind[emailOrUsername] = {
      tenantPromise: promise,
      time: new Date()
    }

    return promise
  }

  findTenantByName (_name, updateLogin) {
    const self = this
    const name = _name.toLowerCase()

    if (this._cacheFindName[name] && (new Date(this._cacheFindName[name].time.getTime() + cacheDuration) > new Date())) {
      return this._cacheFindName[name].tenantPromise.then((t) => extend(true, {}, t))
    }

    const promise = this.tenants.find({ name: new RegExp('^' + name + '$', 'i') }).toArray().then((res) => {
      if (res.length === 0) {
        throw new Error(`Tenant ${name} not found`)
      }

      if (updateLogin === false) {
        return Promise.resolve(res[0])
      }

      return this.tenants.updateOne({ name: res[0].name }, { $set: { lastLogin: new Date() } }).then(() => (res[0]))
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

  async findTenantUserInExtension (username) {
    const self = this

    const users = await this.users.find({
      name: new RegExp('^' + username + '$', 'i')
    }).toArray()

    if (users.length === 0) {
      return null
    }

    const tenant = await self.findTenantByName(users[0].tenantId)

    const user = Object.assign({}, users[0])

    user.adminEmail = tenant.email
    user.isAdmin = false
    user.tenant = tenant

    return user
  }

  async authenticateTenantInExtension (username, password) {
    const user = await this.findTenantUserInExtension(username)

    if (user === null) {
      return
    }

    if (passwordHash.verify(password, user.password)) {
      return omit(user, ['adminEmail', 'tenant'])
    }

    return null
  }

  updateTenant (tenantName, tenantUpdate) {
    this._cacheFind = {}
    this._cacheFindName = {}

    return this.tenants.updateOne({ name: new RegExp('^' + tenantName + '$', 'i') }, tenantUpdate)
  }

  update (q, u, o) {
    if (q && q._id) {
      q._id = convertToObjectId(q._id)
    }

    return this.tenants.updateOne(q, u)
  }

  async generateResetToken (email) {
    const token = uuid()

    const op = await this.tenants.updateOne({ email: email }, { $set: { resetToken: token } })

    // only resolve the token if there was a tenant found
    if (op && op.modifiedCount > 0) {
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

    await self.tenants.updateOne({ _id: tenants[0]._id }, { $set: { password: passwordHash.generate(password) } })

    const tenant = await self.authenticate(tenants[0].email, password)

    if (tenant) {
      await self.tenants.updateOne({ _id: tenants[0]._id }, { $unset: { resetToken: '' } })
    }

    return tenant
  }

  async changePassword (tenantUser, oldPassword, newPassword) {
    const self = this

    const tenants = await this.tenants.find({ email: tenantUser.tenant.email }).toArray()

    if (tenants.length === 0) {
      throw new Error('Tenant not found')
    }

    if (!tenantUser.isAdmin) {
      throw new Error('Change password works only for main admins')
    }

    const tenantInDB = tenants[0]

    if (!passwordHash.verify(oldPassword, tenantInDB.password)) {
      return { code: 'Password is not correct' }
    }

    if (newPassword.length < 4) {
      return { code: 'Password is too short' }
    }

    delete self._cacheAuthenticate[tenantUser.name]

    await self.tenants.updateOne({ _id: tenantInDB._id }, { $set: { password: passwordHash.generate(newPassword) } })

    return { code: 'ok' }
  }

  authenticate (emailOrUsername, password) {
    const self = this

    if (this._cacheAuthenticate[emailOrUsername] && (new Date(this._cacheAuthenticate[emailOrUsername].time.getTime() + cacheDuration) > new Date())) {
      return this._cacheAuthenticate[emailOrUsername].tenantPromise
    }

    const promise = this.tenants.find({ email: emailOrUsername }).toArray().then((res) => {
      if (res.length !== 0) {
        if (!passwordHash.verify(password, res[0].password) &&
          (!res[0].temporaryPassword || !passwordHash.verify(password, res[0].temporaryPassword) || (res[0].temporaryPasswordExpiration < new Date()))) {
          return null
        }

        return {
          ...res[0],
          tenantId: res[0].name,
          isAdmin: true
        }
      }

      return self.authenticateTenantInExtension(emailOrUsername, password)
    }).then((tenantOrUser) => {
      if (!tenantOrUser) {
        return tenantOrUser
      }

      delete tenantOrUser.password

      if (tenantOrUser.isAdmin) {
        delete tenantOrUser.temporaryPassword
        // we still delete workerIp for legacy reasons,
        // just in case is still present in database record
        delete tenantOrUser.workerIp
      }

      return tenantOrUser
    }).catch((e) => {
      delete self._cacheAuthenticate[emailOrUsername]
      throw e
    })

    this._cacheAuthenticate[emailOrUsername] = {
      tenantPromise: promise,
      time: new Date()
    }

    return promise
  }

  async registerContactEmail (tenantUser, contactEmail) {
    if (!tenantUser.isAdmin) {
      throw new Error('Register contact email works only for main admins')
    }

    if (!validator.isEmail(contactEmail)) {
      return { code: 'Not valid email' }
    }

    await this.tenants.updateOne({
      name: tenantUser.tenant.name
    }, {
      $set: { contactEmail: contactEmail }
    })

    delete this._cacheFind[tenantUser.tenant.email]
    delete this._cacheFindName[tenantUser.tenant.name]

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

    await this.tenants.insertOne(tenant)
    await sample(this.reporter.documentStore, tenant)

    return tenant
  }

  async createTemporaryPassword (tenantName) {
    const password = nanoid(7)
    const configs = await this.db.collection('config').find({}).toArray()

    if (!configs || !configs.length || !configs[0].temporaryPasswordAllowed) {
      throw new Error('Temporary password not allowed')
    }

    await this.tenants.updateOne({
      name: tenantName
    }, {
      $set: {
        temporaryPassword: passwordHash.generate(password),
        temporaryPasswordExpiration: new Date(new Date().getTime() + 120 * 60 * 1000)
      }
    })

    return password
  }
}
