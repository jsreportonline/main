const Passport = require('passport').Passport
const LocalStrategy = require('passport-local').Strategy
const BasicStrategy = require('passport-http').BasicStrategy
const validator = require('validator')
const serializator = require('@jsreport/serializator')
const bodyParser = require('body-parser')
const textParser = require('express').text
const path = require('path')
const url = require('url')
const serveStatic = require('serve-static')
const renderFile = require('ejs').renderFile
const sessions = require('client-sessions')
const passwordReset = require('./passwordReset')
const request = require('request')
const plans = require('./plans')

const subdomainCount = 3

module.exports = function (reporter) {
  const passport = new Passport()
  const cookie = {}
  const app = reporter.express.app
  const logger = reporter.logger

  reporter.express.app.isAuthenticated = true

  // this request is treated specially (not handled with the normal authentication flow)
  // because jo is using custom authentication code based on tenant accounts that prevents docker-workers route
  // to pass authentication
  app.post('/api/worker-docker-manager', textParser({
    limit: reporter.options.extensions.express.inputRequestLimit,
    type: '*/*'
  }), async (req, res, next) => {
    const auth = Buffer.from(req.headers.authorization.split(' ')[1], 'base64').toString()
    const username = auth.split(':')[0]
    const password = auth.split(':')[1]

    if (reporter.options.extensions.authentication.admin.username !== username || reporter.options.extensions.authentication.admin.password !== password) {
      return res.status(401).end('unauthorized')
    }

    try {
      const reqBody = serializator.parse(req.body)
      const result = await reporter.dockerManager.executeWorker(reqBody)
      await reporter.dockerManager.handleRemoteHttpResponse(reqBody, res, result)
    } catch (e) {
      res.status(400)
      res.json({ message: e.message, stack: e.stack, ...e })
    }
  })

  app.use((req, res, next) => {
    if (req.hostname && req.hostname.split('.').length >= (subdomainCount - 1)) {
      const domains = req.hostname.split('.')
      cookie.domain = domains.slice(domains.length - 2).join('.')
    }
    next()
  })

  app.use(sessions({
    cookieName: 'session',
    cookie: cookie,
    secret: reporter.options.extensions.authentication.cookieSession.secret,
    duration: 1000 * 60 * 60 * 24 * 365 * 10 // forever
  }))

  app.use(passport.initialize())
  app.use(passport.session())
  app.use(serveStatic(path.join(__dirname, '../', 'public')))
  app.engine('html', renderFile)

  app.get('/terms', (req, res) => {
    res.redirect('https://jsreport.net/jsreportonline-terms.html')
  })

  app.get('/api/ping', (req, res, next) => {
    res.status(200).end('pong')
  })

  app.post('/license-key', (req, res, next) => {
    logger.debug('license key processing')
    const bodyStr = JSON.stringify(req.body)

    logger[bodyStr && bodyStr.indexOf('free') === -1 ? 'info' : 'debug'](`processing license key verification: ${bodyStr}`)
    const start = new Date().getTime()

    return request.post({
      url: `${reporter.options.salesUrl}/verification`,
      method: 'POST',
      headers: req.headers,
      body: req.body,
      json: true
    }, (err, resp, body) => {
      const time = new Date().getTime() - start
      logger.debug('License key processing ended in ' + time)

      if (err && err.code === 'ECONNREFUSED') {
        next(err)
      }

      if (time > 2000) {
        logger.error(`Long verification processing ${time}ms ` + bodyStr)
      }

      // ignore failed validation for free licenses, it takes too much space in loggly and adds noise to the logs
      if (body && body.status === 1 && req.body.licenseKey !== 'free') {
        logger.warn(`Negative license key validation result for ${req.body.licenseKey}`)
      }
    }).pipe(res)
  })

  app.post('/license-usage', (req, res, next) => {
    logger.debug('License usage processing')
    const start = new Date().getTime()

    return request.post({
      url: `${reporter.options.salesUrl}/usage-check`,
      method: 'POST',
      headers: req.headers,
      body: req.body,
      json: true
    }, (err, resp, body) => {
      const time = new Date().getTime() - start
      logger.debug('License usage processing ended in ' + time)
      if (err && err.code === 'ECONNREFUSED') {
        next(err)
      }

      if (time > 2000) {
        logger.error(`Long usage-check processing ${time}ms ${JSON.stringify(req.body)}`)
      }
    }).pipe(res)
  })

  app.post('/gumroad-hook', async (req, res, next) => {
    logger.info(`processing gumroad hook: ${JSON.stringify(req.body)}`)

    try {
      const plan = plans.gumroadProductToPlan(req.body.product_name)

      if (!plan) {
        const start = new Date().getTime()

        return request.post({
          url: `${reporter.options.salesUrl}/gumroad-hook`,
          method: 'POST',
          body: req.body,
          json: true
        }, (err, resp, body) => {
          const time = new Date().getTime() - start
          logger.debug('Gumroad hook processing ended in ' + time)

          if (err && err.code === 'ECONNREFUSED') {
            next(err)
          }

          if (time > 2000) {
            logger.error(`Long gumroad-hook processing ${time}ms ${JSON.stringify(body)}`)
          }
        }).pipe(res)
      }

      if (req.body.is_recurring_charge === 'true') {
        logger.info('gumroad reoccurring payment')
        return res.end('ok')
      }

      let tenantName

      if (req.body.referrer && req.body.referrer.indexOf('jsreportonline') > -1) {
        // eslint-disable-next-line node/no-deprecated-api
        const sourceUrl = url.parse(req.body.referrer)
        tenantName = sourceUrl.hostname.split('.')[0]
      }

      if (!tenantName) {
        const tenantUser = await reporter.multitenancyRepository.findTenantUser(req.body.email)

        if (!tenantUser) {
          return next(new Error('Unable to determine tenant name'))
        }

        tenantName = tenantUser.tenant.name
      }

      if (!tenantName) {
        return next(new Error('Unable to determine tenant name'))
      }

      // when user changes its plan we update the billing date to be based on the date
      // of the plan update
      plan.billingDate = new Date()

      await reporter.multitenancyRepository.updateTenant(tenantName, { $set: plan })

      logger.info(`Updated tenant ${tenantName} to plan ${plan.plan}`)

      res.end('ok')
    } catch (e) {
      next(e)
    }
  })

  app.post('/payments-hook', async (req, res, next) => {
    try {
      if (req.body.secret !== process.env.paymentsSecret) {
        return next(new Error('wrong secret'))
      }

      logger.info(`payment hook received event ${req.body.event} customer.email ${req.body.customer.email}, customer.product.id ${req.body.customer.product.id}`)

      const tenant = await reporter.multitenancyRepository.tenants.findOne({
        $or: [
          { 'payments.customer.uuid': req.body.customer.uuid },
          { email: req.body.customer.email }
        ]
      })

      if (!tenant) {
        throw new Error('Tenant not found')
      }

      if (req.body.event === 'checkouted' && plans.plans[req.body.customer.product.planCode] == null) {
        throw new Error('Wrong plan')
      }

      let update = {
        payments: {
          customer: req.body.customer
        }
      }

      if (req.body.event === 'checkouted') {
        update = {
          ...update,
          plan: req.body.customer.product.planCode,
          billingDate: new Date(),
          creditsAvailable: plans.plans[req.body.customer.product.planCode].creditsAvailable,
          creditsUsed: 0
        }
      }

      if (req.body.event === 'canceled') {
        update = {
          ...update,
          plan: 'free',
          creditsAvailable: plans.plans.free.creditsAvailable,
          billingDate: new Date(),
          creditsUsed: 0
        }
      }

      logger.info(`updating tenant ${tenant.name} plan to ${update.plan}`)

      await reporter.multitenancyRepository.updateTenant(tenant.name, {
        $set: update
      })
      res.send('ok')
    } catch (e) {
      next(e)
    }
  })

  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const tenantOrUser = await reporter.multitenancyRepository.authenticate(username, password)

      if (!tenantOrUser) {
        logger.debug(`invalid credentials for ${username}`)
        return done(null, false, { message: 'Invalid password or user doesn\'t exists' })
      }

      logger.debug(`auth ok for ${username}`)

      tenantOrUser._id = tenantOrUser._id.toString()

      done(null, tenantOrUser)
    } catch (e) {
      logger.error(`error when searching for user ${username} ${e.stack}`)
      done(e)
    }
  }))

  passport.use(new BasicStrategy(async (username, password, done) => {
    try {
      const tenantOrUser = await reporter.multitenancyRepository.authenticate(username, password)

      if (!tenantOrUser) {
        logger.debug('invalid credentials for' + username)
        return done(null, false, { message: 'Invalid password or user doesn\'t exists' })
      }

      logger.debug('basic auth ok for ' + username)

      tenantOrUser._id = tenantOrUser._id.toString()

      done(null, tenantOrUser)
    } catch (e) {
      logger.error('error when searching for user ' + username + ' ' + e.stack)
      done(e)
    }
  }))

  passport.serializeUser((tenantOrUser, done) => {
    done(null, tenantOrUser.isSuperAdmin ? tenantOrUser.email : tenantOrUser.name)
  })

  passport.deserializeUser(async (emailOrUsername, done) => {
    try {
      const tenantUser = await reporter.multitenancyRepository.findTenantUser(emailOrUsername)

      tenantUser._id = tenantUser._id.toString()
      tenantUser.tenant._id = tenantUser.tenant._id.toString()

      done(null, tenantUser)
    } catch (e) {
      done({
        message: 'Tenant not found.',
        code: 'TENANT_NOT_FOUND'
      })
    }
  })

  app.post('/login', bodyParser.urlencoded({ extended: true, limit: '2mb' }), (req, res, next) => {
    req.session.viewModel = req.session.viewModel || {}

    logger.info(`Processing login ${req.body.username}`)

    passport.authenticate('local', (err, tenantOrUser, info) => {
      if (err) {
        return next(err)
      }

      if (!tenantOrUser) {
        req.session.viewModel.login = info.message
        return res.redirect('/sign')
      }

      logger.debug(`login successfull ${tenantOrUser.isSuperAdmin ? tenantOrUser.email : tenantOrUser.name} ${tenantOrUser.isSuperAdmin}`, { tenant: tenantOrUser.tenantId })

      req.session.viewModel = {}

      logger.debug(`log in ${tenantOrUser.isSuperAdmin ? tenantOrUser.email : tenantOrUser.name}`, { tenant: tenantOrUser.tenantId })

      req.logIn(tenantOrUser, (err) => {
        logger.debug(`log in done${err != null ? ` ${err}` : ''}`, { tenant: tenantOrUser.tenantId })

        if (err) {
          logger.error(err, { tenant: tenantOrUser.tenantId })
          return next(err)
        }

        return res.redirect('/sign')
      })
    })(req, res, next)
  })

  app.post('/change-password', bodyParser.urlencoded({ extended: true, limit: '2mb' }), async (req, res, next) => {
    req.session.viewModel = req.session.viewModel || {}
    req.session.viewModel.type = 'performReset'
    req.session.viewModel.resetToken = req.body.resetToken

    logger.info(`Processing change-password ${req.body.resetToken}`)

    if (req.body.password == null || req.body.password.length < 4) {
      req.session.viewModel.password = 'Password must be at least 4 characters long'
      return res.redirect('/sign')
    }

    if (req.body.password !== req.body.passwordConfirm) {
      req.session.viewModel.passwordConfirm = 'Passwords are not the same'
      return res.redirect('/sign')
    }

    try {
      const tenantAuthenticated = await reporter.multitenancyRepository.resetPassword(req.body.resetToken, req.body.password)

      if (!tenantAuthenticated) {
        req.session.viewModel.resetMessage = 'Unable to perform reset, token is not valid'
        return res.redirect('/sign')
      }

      req.logIn(tenantAuthenticated, (err) => {
        if (err) {
          return next(err)
        }

        return res.redirect('/sign')
      })
    } catch (e) {
      req.session.viewModel.resetMessage = 'Unable to perform reset'
      return res.redirect('/sign')
    }
  })

  app.post('/register', bodyParser.urlencoded({ extended: true, limit: '2mb' }), async (req, res, next) => {
    req.session.viewModel = req.session.viewModel || {}
    req.session.viewModel.previousName = req.body.name
    req.session.viewModel.previousUsername = req.body.username

    logger.info(`Processing register ${req.body.username}:${req.body.name}`)

    req.session.viewModel.type = 'register'

    if (!req.body.terms) {
      req.session.viewModel.terms = 'You must agree with terms and conditions to sign up'
      return res.redirect('/sign')
    }

    // eslint-disable-next-line no-useless-escape
    const regex = /^[a-zA-Z0-9\-]+$/

    if (!regex.test(req.body.name)) {
      req.session.viewModel.name = 'subdomain must contain only numbers, letters and dashes'
      return res.redirect('/sign')
    }

    try {
      await reporter.multitenancyRepository.findTenantByName(req.body.name, false)

      req.session.viewModel.name = 'Tenant name is already taken'
      return res.redirect('/sign')
    } catch (e) {
      try {
        const tenantUser = await reporter.multitenancyRepository.findTenantUser(req.body.username)

        if (tenantUser) {
          req.session.viewModel.username = 'Selected email is already taken'
          return res.redirect('/sign')
        }

        if (!validator.isEmail(req.body.username)) {
          req.session.viewModel.username = 'Not valid email'
          return res.redirect('/sign')
        }

        if (req.body.password == null || req.body.password.length < 4) {
          req.session.viewModel.password = 'Password must be at least 4 characters long'
          return res.redirect('/sign')
        }

        if (req.body.password !== req.body.passwordConfirm) {
          req.session.viewModel.passwordConfirm = 'Passwords are not the same'
          return res.redirect('/sign')
        }

        await reporter.multitenancyRepository.registerTenant(req.body.username, req.body.name, req.body.password)

        passport.authenticate('local', (err, tenantOrUser, info) => {
          if (err) {
            return next(err)
          }

          req.session.viewModel = {}

          req.logIn(tenantOrUser, (err) => {
            if (err) {
              return next(err)
            }

            return res.redirect('/sign')
          })
        })(req, res, next)
      } catch (e) {
        next(e)
      }
    }
  })

  app.post('/logout', (req, res) => {
    const tenant = req.context.tenant

    res.clearCookie('session')
    req.session.destroy()
    req.logout()

    const logArgs = ['login out']

    if (tenant) {
      logArgs.push({ tenant: tenant.name })
    }

    logger.debug(...logArgs)

    const domains = req.headers.host.split('.')

    res.redirect(`http://${domains[domains.length - 2]}.${domains[domains.length - 1]}`)
  })

  app.use(async (req, res, next) => {
    const domains = req.headers.host.split('.')

    if (domains.length !== subdomainCount && !req.user) {
      return next()
    }

    const tenantName = req.user ? req.user.tenant.name : domains[0]

    try {
      const tenant = await reporter.multitenancyRepository.findTenantByName(tenantName)

      tenant._id = tenant._id.toString()

      delete tenant.password
      delete tenant.temporaryPassword
      // we still delete workerIp for legacy reasons,
      // just in case is still present in database record
      delete tenant.workerIp
      delete tenant.billingHistory

      req.context.tenant = tenant

      next()
    } catch (e) {
      next()
    }
  })

  app.post('/reset', async (req, res, next) => {
    logger.info(`reset password for ${req.body ? req.body.username : 'unknown'}`)

    try {
      const token = await reporter.multitenancyRepository.generateResetToken(req.body.username)

      if (token) {
        passwordReset(reporter.mailer, req.body.username, token, req.protocol + '://' + req.get('host'))
      }

      req.session.viewModel = req.session.viewModel || {}
      req.session.viewModel.type = 'reset'
      req.session.viewModel.resetMessage = 'You can find the password reset link in your email'

      res.redirect('/sign')
    } catch (e) {
      next(e)
    }
  })

  app.use((req, res, next) => {
    if (!req.context.tenant) {
      return next()
    }

    const publicRoute = reporter.authentication.publicRoutes.find(r => String(req.url).startsWith(r))
    // eslint-disable-next-line node/no-deprecated-api
    const pathname = url.parse(req.url).pathname

    req.isPublic = publicRoute || String(pathname).endsWith('.js') || String(pathname).endsWith('.css')

    next()
  })

  app.get('/sign', (req, res, next) => {
    let viewModel

    if (req.query.resetToken) {
      viewModel = Object.assign({}, req.session.viewModel || {}, {
        resetToken: req.query.resetToken,
        type: 'performReset'
      })

      req.session.viewModel = null

      return res.render(path.join(__dirname, '../', 'public', 'login.ejs'), {
        viewModel: viewModel
      })
    }

    if (!req.user && !req.isPublic) {
      viewModel = Object.assign({}, req.session.viewModel || {})
      req.session.viewModel = null

      res.render(path.join(__dirname, '../', 'public', 'login.ejs'), { viewModel: viewModel })
    } else {
      next()
    }
  })

  app.get('/gumroad', async (req, res, next) => {
    try {
      const tenant = await reporter.multitenancyRepository.findTenantByName(req.user.tenant.name)

      res.render(path.join(__dirname, '../', 'public', 'gumroad.html'), { viewModel: tenant })
    } catch (e) {
      next(e)
    }
  })

  // authenticate basic if request to API
  app.use((req, res, next) => {
    if (
      (req.headers.authorization || (!req.isAuthenticated || !req.isAuthenticated())) &&
      (req.url.lastIndexOf('/api', 0) === 0 || req.url.lastIndexOf('/odata', 0) === 0 || req.url.lastIndexOf('/reports', 0) === 0)
    ) {
      req.isBasicAuth = true

      passport.authenticate('basic', (err, tenantOrUser, info) => {
        if (err) {
          return next(err)
        }

        if (!tenantOrUser) {
          if (req.isPublic) {
            return next()
          }

          res.setHeader('WWW-Authenticate', 'Basic realm=\'realm\'')
          return res.status(401).end()
        }

        req.logIn(tenantOrUser, () => {
          next()
        })
      })(req, res, next)
    } else {
      next()
    }
  })

  app.use((req, res, next) => {
    res.set('Connection', 'close')

    const domains = req.headers.host.split('.')

    if (!req.user && !req.isPublic) {
      if (subdomainCount === domains.length + 1) {
        // user not authenticated, redirect to login page
        res.clearCookie('session')
        req.session.destroy()
        req.logout()
        return res.redirect('/sign')
      } else {
        // user sending not authenticated request to subdomain, redirect to root login page
        res.clearCookie('session')
        req.session.destroy()
        domains.shift()
        return res.redirect(`http://${domains.join('.')}/sign`)
      }
    }

    if (req.context.tenant && (subdomainCount === domains.length)) {
      return next()
    }

    if (req.context.tenant) {
      domains.unshift(req.context.tenant.name)
      return res.redirect(`http://${domains.join('.')}`)
    }

    res.clearCookie('session')
    req.session.destroy()
    req.logout()

    res.redirect(`http://${domains[domains.length - 2]}.${domains[domains.length - 1]}`)
  })

  app.use((req, res, next) => {
    const tenant = req.context.tenant

    req.context.user = req.user

    if (tenant) {
      reporter.logger.info(`Processing ${req.method} ${req.path} ${req.context.user?.name}`, { tenant: tenant.name })
    } else {
      reporter.logger.info(`Processing anonymous ${req.method} ${req.path}`)
    }

    next()
  })

  app.post('/api/password', async (req, res, next) => {
    logger.debug(`change-password ${req.user.name}`)

    try {
      const m = await reporter.multitenancyRepository.changePassword(req.user, req.body.oldPassword, req.body.newPassword)

      res.send(m)
    } catch (e) {
      next(e)
    }
  })

  app.post('/api/account-email', async (req, res, next) => {
    logger.debug(`change-account-email ${req.user.tenant.name}`)

    try {
      if (!validator.isEmail(req.body.newEmail)) {
        return res.send({ code: 'Not valid email' })
      }

      const tenantUser = await reporter.multitenancyRepository.findTenantUser(req.body.newEmail)

      if (tenantUser) {
        return res.send({ code: 'Email is already used by another account' })
      }

      await reporter.multitenancyRepository.updateTenant(req.user.tenant.name, { $set: { email: req.body.newEmail } })

      // logout
      res.clearCookie('session')
      req.session.destroy()
      req.logout()

      res.send({ code: 'ok' })
    } catch (e) {
      next(e)
    }
  })

  app.post('/api/register-contact-email', bodyParser.urlencoded({ extended: true, limit: '2mb' }), async (req, res, next) => {
    logger.debug(`register-contact-email for tenant (${req.user.tenant.name}): ${req.body.contactEmail}`)

    try {
      const m = await reporter.multitenancyRepository.registerContactEmail(req.user, req.body.contactEmail)

      res.send(m)
    } catch (e) {
      next(e)
    }
  })

  app.get('/api/temporary-password/:name', async (req, res, next) => {
    if (req.user.tenant.name !== reporter.options.admin) {
      return res.status(500).send('Forbidden')
    }

    try {
      const m = await reporter.multitenancyRepository.createTemporaryPassword(req.params.name)
      const admin = await reporter.multitenancyRepository.findTenantByName(req.params.name, false)

      res.status(200).send(m + ' ' + admin.email)
    } catch (e) {
      next(e)
    }
  })

  app.get('/api/dump', async (req, res, next) => {
    if (req.user.tenant.name !== reporter.options.admin) {
      return res.status(500).send('Forbidden')
    }

    try {
      global.gc()
      require('v8').writeHeapSnapshot()

      res.status(200).send('done')
    } catch (e) {
      next(e)
    }
  })

  app.get('/api/tenant', async (req, res, next) => {
    return res.status(200).send(req.user.tenant)
  })

  app.delete('/api/payments/subscription', async (req, res, next) => {
    return request({
      url: `https://jsreport.net/api/payments/customer/${req.user.tenant.payments.customer.uuid}/subscription/${req.user.tenant.payments.customer.product.id}`,
      method: 'DELETE'
    }, (err, resp, body) => {
      if (err) {
        next(err)
      }
    }).pipe(res)
  })

  app.use((err, req, res, next) => {
    if (typeof err === 'string') {
      err = {
        message: err
      }
    }

    err = err || {}
    err.message = err.message || 'Unrecognized error'

    if (err.code === 'TENANT_NOT_FOUND') {
      req.logout()
      res.clearCookie('session')
      req.session.destroy()
      return res.redirect('/sign')
    }

    res.status(500)

    const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`

    logger.warn(`Error during processing request: ${fullUrl} details: ${err.message} ${err.stack}`)

    if (req.get('Content-Type') !== 'application/json') {
      res.write(`Error occurred - ${err.message}\n`)

      if (err.stack != null) {
        res.write(`Stack - ${err.stack}`)
      }

      res.end()
      return
    }

    res.json(err)
  })
}
