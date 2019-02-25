const Passport = require('passport').Passport
const LocalStrategy = require('passport-local').Strategy
const BasicStrategy = require('passport-http').BasicStrategy
const validator = require('validator')
const bodyParser = require('body-parser')
const path = require('path')
const url = require('url')
const serveStatic = require('serve-static')
const renderFile = require('ejs').renderFile
const sessions = require('client-sessions')
const passwordReset = require('./passwordReset')
const request = require('request')
const plans = require('./plans')
const createRemoteRequestHandler = require('jsreport-docker-workers/lib/remoteRequestHandler')

const subdomainCount = 3

module.exports = function (reporter) {
  const passport = new Passport()
  const cookie = {}
  const app = reporter.express.app
  const logger = reporter.logger

  reporter.addRequestContextMetaConfig('tenant', { sandboxHidden: true })
  reporter.addRequestContextMetaConfig('user', { sandboxHidden: true })

  reporter.express.app.isAuthenticated = true

  // this request is treated specially (not handled with the normal authentication flow)
  // because jo is using custom authentication code that prevents docker-workers route
  // to pass authentication
  app.post('/api/worker-docker-manager', (req, res, next) => {
    const auth = Buffer.from(req.headers.authorization.split(' ')[1], 'base64').toString()
    const username = auth.split(':')[0]
    const password = auth.split(':')[1]

    if (reporter.options.extensions.authentication.admin.username !== username || reporter.options.extensions.authentication.admin.password !== password) {
      return res.status(401).end('unauthorized')
    }

    return createRemoteRequestHandler(
      reporter.dockerManager.executeScript,
      reporter.dockerManager.executeRecipe
    )(req, res, next)
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
    const bodyStr = JSON.stringify(req.body)

    logger[bodyStr && bodyStr.indexOf('free') === -1 ? 'info' : 'debug'](`processing license key verification: ${bodyStr}`)

    return request.post({
      url: `${reporter.options.salesUrl}/verification`,
      method: 'POST',
      headers: req.headers,
      body: req.body,
      json: true
    }, (err, resp, body) => {
      if (err && err.code === 'ECONNREFUSED') {
        next(err)
      }

      if (body && body.status === 1) {
        logger.warn(`Negative license key validation result for ${req.body.licenseKey}`)
      }
    }).pipe(res)
  })

  app.post('/gumroad-hook', async (req, res, next) => {
    logger.info(`processing gumroad hook: ${JSON.stringify(req.body)}`)

    try {
      const plan = plans.gumroadProductToPlan(req.body['product_name'])

      if (!plan) {
        return request.post({
          url: `${reporter.options.salesUrl}/gumroad-hook`,
          method: 'POST',
          body: req.body,
          json: true
        }, (err, resp, body) => {
          if (err && err.code === 'ECONNREFUSED') {
            next(err)
          }
        }).pipe(res)
      }

      if (!req.body['url_params']) {
        logger.info('gumroad reoccuring payment')
        return res.end('ok')
      }

      let sourceUrl = url.parse(req.body['url_params']['source_url'])

      if (!sourceUrl.hostname) {
        sourceUrl = url.parse(decodeURIComponent(req.body['url_params']['source_url']))
      }

      const tenantName = sourceUrl.hostname.split('.')[0]

      await reporter.multitenancyRepository.updateTenant(tenantName, { $set: plan })

      logger.info(`Updated tenant ${tenantName} to plan ${plan.plan}`)

      res.end('ok')
    } catch (e) {
      next(e)
    }
  })

  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const tenant = await reporter.multitenancyRepository.authenticate(username, password)

      if (!tenant) {
        logger.debug(`invalid credentials for ${username}`)
        return done(null, false, { message: 'Invalid password or user doesn\'t exists' })
      }

      logger.debug(`auth ok for ${username}`)

      tenant._id = tenant._id.toString()

      done(null, tenant)
    } catch (e) {
      logger.error(`error when searching for user ${username} ${e.stack}`)
      done(e)
    }
  }))

  passport.use(new BasicStrategy(async (username, password, done) => {
    try {
      const user = await reporter.multitenancyRepository.authenticate(username, password)

      if (!user) {
        logger.debug('invalid credentials for' + username)
        return done(null, false, { message: 'Invalid password or user doesn\'t exists' })
      }

      logger.debug('basic auth ok for ' + username)

      user._id = user._id.toString()

      done(null, user)
    } catch (e) {
      logger.error('error when searching for user ' + username + ' ' + e.stack)
      done(e)
    }
  }))

  passport.serializeUser((user, done) => {
    done(null, user.email)
  })

  passport.deserializeUser(async (id, done) => {
    try {
      const tenant = await reporter.multitenancyRepository.findTenant(id)

      tenant._id = tenant._id.toString()

      done(null, tenant)
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

    passport.authenticate('local', (err, user, info) => {
      if (err) {
        return next(err)
      }

      if (!user) {
        req.session.viewModel.login = info.message
        return res.redirect('/sign')
      }

      logger.debug(`login successfull ${user.email} ${user.isAdmin} ${user.name}`)

      req.session.viewModel = {}

      logger.debug('log in')

      req.logIn(user, (err) => {
        logger.debug(`done ${err}`)

        if (err) {
          logger.error(err)
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
      const tenant = await reporter.multitenancyRepository.resetPassword(req.body.resetToken, req.body.password)

      if (!tenant) {
        req.session.viewModel.resetMessage = 'Unable to perform reset, token is not valid'
        return res.redirect(`/sign`)
      }

      req.logIn(tenant, (err) => {
        if (err) {
          return next(err)
        }

        return res.redirect('/sign')
      })
    } catch (e) {
      req.session.viewModel.resetMessage = 'Unable to perform reset'
      return res.redirect(`/sign`)
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
        let tenant = await reporter.multitenancyRepository.findTenant(req.body.username)

        if (tenant) {
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

        tenant = await reporter.multitenancyRepository.registerTenant(req.body.username, req.body.name, req.body.password)

        passport.authenticate('local', (err, user, info) => {
          if (err) {
            return next(err)
          }

          req.session.viewModel = {}

          req.logIn(user, (err) => {
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
    res.clearCookie('session')
    req.session.destroy()
    req.logout()

    logger.debug('loging out')

    const domains = req.headers.host.split('.')

    res.redirect(`http://${domains[domains.length - 2]}.${domains[domains.length - 1]}`)
  })

  app.use(async (req, res, next) => {
    const domains = req.headers.host.split('.')

    if (domains.length !== subdomainCount && !req.user) {
      return next()
    }

    const tenantName = req.user ? req.user.name : domains[0]

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
      const tenant = await reporter.multitenancyRepository.findTenantByName(req.user.name)

      res.render(path.join(__dirname, '../', 'public', 'gumroad.html'), { viewModel: tenant })
    } catch (e) {
      next(e)
    }
  })

  // authenticate basic if request to API
  app.use((req, res, next) => {
    if (
      (req.headers.authorization || (!req.isAuthenticated || !req.isAuthenticated())) &&
      (req.url.lastIndexOf('/api', 0) === 0 || req.url.lastIndexOf('/odata', 0) === 0)
    ) {
      req.isBasicAuth = true

      passport.authenticate('basic', (err, user, info) => {
        if (err) {
          return next(err)
        }

        if (!user) {
          if (req.isPublic) {
            return next()
          }

          res.setHeader('WWW-Authenticate', 'Basic realm=\'realm\'')
          return res.status(401).end()
        }

        req.logIn(user, () => {
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
      reporter.logger.info(`Processing ${req.method} ${req.path} ${tenant.username}`, { tenant: tenant.name })
    } else {
      reporter.logger.info(`Processing anonymous ${req.method} ${req.path}`)
    }

    next()
  })

  app.get('/api/message', async (req, res, next) => {
    try {
      const m = await reporter.multitenancyRepository.findMessage()

      res.status(200).send(m)
    } catch (e) {
      next(e)
    }
  })

  app.post('/api/password', async (req, res, next) => {
    logger.debug(`change-password ${req.user.username}`)

    try {
      const m = await reporter.multitenancyRepository.changePassword(req.user, req.body.oldPassword, req.body.newPassword)

      res.send(m)
    } catch (e) {
      next(e)
    }
  })

  app.post('/api/register-contact-email', bodyParser.urlencoded({ extended: true, limit: '2mb' }), async (req, res, next) => {
    logger.debug(`register-contact-email for tenant (${req.user.name}): ${req.body.contactEmail}`)

    try {
      const m = await reporter.multitenancyRepository.registerContactEmail(req.user, req.body.contactEmail)

      res.send(m)
    } catch (e) {
      next(e)
    }
  })

  app.get('/api/temporary-password/:name', async (req, res, next) => {
    if (req.user.name !== reporter.options.admin) {
      return res.status(500).send('Forbiden')
    }

    try {
      const m = await reporter.multitenancyRepository.createTemporaryPassword(req.params.name)

      res.status(200).send(m)
    } catch (e) {
      next(e)
    }
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
      res.write(`Error occured - ${err.message}\n`)

      if (err.stack != null) {
        res.write(`Stack - ${err.stack}`)
      }

      res.end()
      return
    }

    res.json(err)
  })
}
