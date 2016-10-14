const passwordHash = require('password-hash')
const uuid = require('uuid').v1

const cacheDuration = 5000

module.exports = class MultitenancyRepository {
  constructor (reporter) {
    this.reporter = reporter
    this._cacheAuthenticate = {}
    this._cacheFind = {}
  }

  get db () {
    return this.reporter.documentStore.provider.db.db(this.reporter.options.connectionString.rootDatabaseName || 'multitenant-root')
  }

  get tenants () {
    return this.db.collection('tenants')
  }

  get users () {
    return this.reporter.documentStore.provider.db.db(this.reporter.options.connectionString.databaseName || 'multitenant').collection('users')
  }

  find (q) {
    return this.tenants.find(q).toArray()
  }

  findTenant (email) {
    const self = this

    if (this._cacheFind[email] && (new Date(this._cacheFind[email].time.getTime() + cacheDuration) > new Date())) {
      return this._cacheFind[email].tenantPromise;
    }

    const promise = this.tenants.find({ email: email }).toArray().then((res) => {
      if (res.length < 1) {
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
    }).catch((e) => {
      delete self._cacheFind[email]
      throw e
    })

    this._cacheFind[email] = {
      tenantPromise: promise,
      time: new Date()
    };

    return promise;
  }

  findTenantByName (name) {
    const self = this
    name = name.toLowerCase()
    if (this._cacheFind[name] && (new Date(this._cacheFind[name].time.getTime() + cacheDuration) > new Date())) {
      return this._cacheFind[name].tenantPromise;
    }

    const promise = this.tenants.find({ name: new RegExp('^' + name + '$', 'i') }).toArray().then((res) => {
      if (res.length !== 1) {
        throw new Error(`Tenant ${name}  not found`)
      }

      res[0].username = res[0].email
      res[0].isAdmin = true

      return this.tenants.update({ name: name }, { $set: { lastLogin: new Date() }}).then(() => (res[0]))
    }).catch((e) => {
      delete self._cacheFind[name]
      throw e
    })

    this._cacheFind[name] = {
      tenantPromise: promise,
      time: new Date()
    };

    return promise;
  }

  findTenantInExtension (email) {
    const self = this

    return this.users.find({
      username: email
    }).toArray().then((users) => {
      if (users.length !== 1) {
        return null;
      }
      return self.findTenantByName(users[0].tenantId).then((tenant) => {
        const user = Object.assign({}, tenant, users[0])
        user.email = users[0].username
        user.password = users[0].password
        user.isAdmin = false

        return user
      })
    })
  }

  authenticateTenantInExtension (username, password) {
    return this.findTenantInExtension(username).then(function (user) {
      if (user === null)
        return

      if (passwordHash.verify(password, user.password))
        return user

      return null
    })
  }

  updateTenant (tenantName, tenantUpdate) {
    return this.tenants.update({ name: tenantName }, tenantUpdate)
  }

  update (q, u, o) {
    return this.tenants.update(q, u)
  }

  generateResetToken (email) {
    const token = uuid()
    return this.tenants.update({ email: email }, { $set: { resetToken: token } }).then(() => token)
  }

  resetPassword (token, password) {
    const self = this

    return this.tenants.find({ resetToken: token }).toArray().then((tenants) => {
      if (tenants.length !== 1) {
        return null
      }

      delete self._cacheAuthenticate[tenants[0].email]

      return self.tenants.update({ _id: tenants[0]._id }, { $set: { password: passwordHash.generate(password) } }).then(() => {
        return self.authenticate(tenants[0].email, password).then((tenant) => {
          if (tenant) {
            self.tenants.update({ _id: tenants[0]._id }, { $unset: { resetToken: '' } })
          }
          return tenant
        })
      })
    })
  }

  changePassword (tenant, oldPassword, newPassword) {
    const self = this

    if (!tenant.isAdmin) {
      throw new Error('Change password works only for main admins')
    }

    return this.tenants.find({ email: tenant.username }).toArray().then((tenants) => {
      if (tenants.length !== 1) {
        throw new Error('Tenant not found')
      }

      const tenant = tenants[0]

      if (!passwordHash.verify(oldPassword, tenant.password)) {
        return { code: `Password is not correct` }
      }

      if (newPassword.length < 4) {
        return { code: `Password is too short` }
      }

      delete self._cacheAuthenticate[tenant.username]

      return self.tenants.update({ _id: tenant._id }, { $set: { password: passwordHash.generate(newPassword) } }).then(() => {
        return { code: 'ok' }
      })
    })
  }

  authenticate (username, password) {
    const self = this

    if (this._cacheAuthenticate[username] && (new Date(this._cacheAuthenticate[username].time.getTime() + cacheDuration) > new Date())) {
      return this._cacheAuthenticate[username].tenantPromise;
    }

    const promise = this.tenants.find({ email: username }).toArray().then((res) => {
      if (res.length === 1) {
        /*if (!passwordHash.verify(password, res[0].password)) {
          return null
        }*/

        res[0].isAdmin = true
        return res[0]
      }

      return self.authenticateTenantInExtension(username, password)
    }).catch((e) => {
      delete self._cacheAuthenticate[username]
      throw e
    })

    this._cacheAuthenticate[username] = {
      tenantPromise: promise,
      time: new Date()
    };

    return promise;
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