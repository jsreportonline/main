var passwordHash = require('password-hash')

module.exports = class MultitenancyRepository {
  constructor (reporter) {
    this.reporter = reporter
    this._cacheAuthenticate = {}
    this._cacheFind = {}
  }

  get db () {
    return this.reporter.documentStore.provider.db.db('multitenant-root')
  }

  get tenants () {
    return this.db.collection('tenants')
  }

  get users () {
    return this.reporter.documentStore.provider.db.db('multitenant').collection('users')
  }

  find (q) {
    return this.tenants.find(q).toArray()
  }

  findTenant (email) {
    const self = this

    if (this._cacheFind[email] && (new Date(this._cacheFind[email].time.getTime() + 10000) > new Date())) {
      return this._cacheFind[email].tenantPromise;
    }

    const promise = this.tenants.find({ email: email }).toArray().then((res) => {

      if (res.length < 1) {
        return self.findTenantInExtension(email)
      }

      res[0].username = res[0].email
      res[0].isAdmin = true
      return res[0]
    })

    this._cacheFind[email] = {
      tenantPromise: promise,
      time: new Date()
    };

    return promise;
  }

  findTenantByName (name) {
    name = name.toLowerCase()
    if (this._cacheFind[name] && (new Date(this._cacheFind[name].time.getTime() + 10000) > new Date())) {
      return this._cacheFind[name].tenantPromise;
    }

    const promise = this.tenants.find({name: new RegExp('^' + name + '$', 'i')}).toArray().then((res) => {
      if (res.length < 1) {
        throw new Error(`Tenant ${name} + ' not found`)
      }

      res[0].username = res[0].email
      res[0].isAdmin = true
      return res[0]
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
    console.log(`authenticating in extension`)
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

  update (q, u) {
    return this.tenants.update(q, u)
  }

  authenticate (username, password) {
    const self = this
    console.log(`authenticating ${username} / ${password}`)
    if (this._cacheAuthenticate[username] && (new Date(this._cacheAuthenticate[username].time.getTime() + 10000) > new Date())) {
      return this._cacheAuthenticate[username].tenantPromise;
    }

    const promise = this.tenants.find({ email: username }).toArray().then((res) => {
      if (res.length === 1) {
        res[0].isAdmin = true
        return res[0]
      }

      return self.authenticateTenantInExtension(username, password)
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