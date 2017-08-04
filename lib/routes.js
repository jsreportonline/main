var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
var BasicStrategy = require('passport-http').BasicStrategy
var validator = require('validator')
var bodyParser = require('body-parser')
var path = require('path')
var _ = require('underscore')
var url = require('url')
var S = require('string')
var serveStatic = require('serve-static')
var renderFile = require('ejs').renderFile
var sessions = require('client-sessions')
var passwordReset = require('./passwordReset')
var request = require('request')
var plans = require('./plans')

var subdomainCount = 3

module.exports = function (reporter) {
  var cookie = {}
  var app = reporter.express.app
  var logger = reporter.logger
  reporter.express.app.isAuthenticated = true

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
    secret: reporter.options.authentication.cookieSession.secret,
    duration: 1000 * 60 * 60 * 24 * 365 * 10 // forever
  }))

  app.use(passport.initialize())
  app.use(passport.session())
  app.use(serveStatic(path.join(__dirname, '../', 'public')))
  app.engine('html', renderFile)

  app.get('/terms', function (req, res) {
    res.render(path.join(__dirname, '../', 'public', 'terms.html'))
  })

  app.get('/api/ping', function (req, res, next) {
    request.get(reporter.options.workerUrl + '/status', (err, resp, body) => {
      if (err) {
        return res.status(500).send(err)
      }

      if (resp.statusCode === 500) {
        reporter.logger.error(body)
      }

      res.status(200).send(body)
    })
  })

  app.post('/license-key', function (req, res, next) {
    var bodyStr = JSON.stringify(req.body)
    logger[bodyStr && bodyStr.indexOf('free') === -1 ? 'info' : 'debug']('processing license key verification: ' + bodyStr)

    return request.post({
      url: `${reporter.options.salesUrl}/verification`,
      method: 'POST',
      headers: req.headers,
      body: req.body,
      json: true
    }, function (err, resp, body) {
      if (err && err.code === 'ECONNREFUSED') {
        next(err)
      }
    }).pipe(res)
  })

  app.post('/gumroad-hook', function (req, res, next) {
    logger.info('processing gumroad hook: ' + JSON.stringify(req.body))
    try {
      var plan = plans.gumroadProductToPlan(req.body['product_name'])
      if (!plan) {
        return request.post({
          url: `${reporter.options.salesUrl}/gumroad-hook`,
          method: 'POST',
          body: req.body,
          json: true
        }, function (err, resp, body) {
          if (err && err.code === 'ECONNREFUSED') {
            next(err)
          }
        }).pipe(res)
      }

      if (!req.body['url_params']) {
        logger.info('gumroad reoccuring payment')
        return res.end('ok')
      }

      var sourceUrl = url.parse(req.body['url_params']['source_url'])
      if (!sourceUrl.hostname) {
        sourceUrl = url.parse(decodeURIComponent(req.body['url_params']['source_url']))
      }

      var tenantName = sourceUrl.hostname.split('.')[0]
      reporter.multitenancyRepository.updateTenant(tenantName, { $set: plan })
      logger.info(`Updated tenant ${tenantName} to plan ${plan.plan}`)
      res.end('ok')
    } catch (e) {
      next(e)
    }
  })

  passport.use(new LocalStrategy(function (username, password, done) {
    reporter.multitenancyRepository.authenticate(username, password).then(function (tenant) {
      if (!tenant) {
        logger.debug('invalid credentials for ' + username)
        return done(null, false, { message: 'Invalid password or user doesn\'t exists' })
      }

      logger.debug('auth ok for ' + username)
      return done(null, tenant)
    }).catch(function (e) {
      logger.error('error when searching for user ' + username + ' ' + e.stack)
      done(e)
    })
  }))

  passport.use(new BasicStrategy(function (username, password, done) {
    reporter.multitenancyRepository.authenticate(username, password).then(function (user) {
      if (!user) {
        logger.debug('invalid credentials for' + username)
        return done(null, false, { message: 'Invalid password or user doesn\'t exists' })
      }

      logger.debug('basic auth ok for ' + username)
      return done(null, user)
    }).catch(function (e) {
      logger.error('error when searching for user ' + username + ' ' + e.stack)
      done(e)
    })
  }))

  passport.serializeUser(function (user, done) {
    done(null, user.email)
  })

  passport.deserializeUser(function (id, done) {
    reporter.multitenancyRepository.findTenant(id).then(function (tenant) {
      done(null, tenant)
    }).catch(function (e) {
      done({
        message: 'Tenant not found.',
        code: 'TENANT_NOT_FOUND'
      })
    })
  })

  app.post('/login', bodyParser.urlencoded({ extended: true, limit: '2mb' }), function (req, res, next) {
    req.session.viewModel = req.session.viewModel || {}
    logger.info('Processing login ' + req.body.username)

    passport.authenticate('local', function (err, user, info) {
      if (err) {
        return next(err)
      }

      if (!user) {
        req.session.viewModel.login = info.message
        return res.redirect('/sign')
      }

      logger.debug('login successfull ' + user.email + ' ' + user.isAdmin + ' ' + user.name)

      req.session.viewModel = {}

      logger.debug('log in')
      req.logIn(user, function (err) {
        logger.debug('done ' + err)
        if (err) {
          logger.error(err)
          return next(err)
        }
        return res.redirect('/sign')
      })
    })(req, res, next)
  })

  app.post('/change-password', bodyParser.urlencoded({ extended: true, limit: '2mb' }), function (req, res, next) {
    req.session.viewModel = req.session.viewModel || {}
    req.session.viewModel.type = 'performReset'
    req.session.viewModel.resetToken = req.body.resetToken

    logger.info('Processing change-password ' + req.body.resetToken)

    if (req.body.password == null || req.body.password.length < 4) {
      req.session.viewModel.password = 'Password must be at least 4 characters long'
      return res.redirect('/sign')
    }

    if (req.body.password !== req.body.passwordConfirm) {
      req.session.viewModel.passwordConfirm = 'Passwords are not the same'
      return res.redirect('/sign')
    }

    reporter.multitenancyRepository.resetPassword(req.body.resetToken, req.body.password).then((tenant) => {
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
    }).catch(() => {
      req.session.viewModel.resetMessage = 'Unable to perform reset'
      return res.redirect(`/sign`)
    })
  })

  app.post('/register', bodyParser.urlencoded({ extended: true, limit: '2mb' }), function (req, res, next) {
    req.session.viewModel = req.session.viewModel || {}
    req.session.viewModel.previousName = req.body.name
    req.session.viewModel.previousUsername = req.body.username

    logger.info('Processing register ' + req.body.username + ':' + req.body.name)

    req.session.viewModel.type = 'register'

    if (!req.body.terms) {
      req.session.viewModel.terms = 'You must agree with terms and conditions to sign up'
      return res.redirect('/sign')
    }

    // eslint-disable-next-line no-useless-escape
    var regex = /^[a-zA-Z0-9\-]+$/
    if (!regex.test(req.body.name)) {
      req.session.viewModel.name = 'subdomain must contain only numbers, letters and dashes'
      return res.redirect('/sign')
    }

    reporter.multitenancyRepository.findTenantByName(req.body.name, false).then(() => {
      req.session.viewModel.name = 'Tenant name is already taken'
      return res.redirect('/sign')
    }).catch(function () {
      return reporter.multitenancyRepository.findTenant(req.body.username).then((tenant) => {
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

        return reporter.multitenancyRepository.registerTenant(req.body.username, req.body.name, req.body.password).then((tenant) => {
          passport.authenticate('local', function (err, user, info) {
            if (err) {
              return next(err)
            }

            req.session.viewModel = {}

            req.logIn(user, function (err) {
              if (err) {
                return next(err)
              }

              return res.redirect('/sign')
            })
          })(req, res, next)
        })
      }).catch((err) => {
        next(err)
      })
    })
  })

  app.post('/logout', function (req, res) {
    res.clearCookie('session')
    req.session.destroy()
    req.logout()

    logger.debug('loging out')

    var domains = req.headers.host.split('.')

    res.redirect('http://' + domains[domains.length - 2] + '.' + domains[domains.length - 1])
  })

  app.use(function (req, res, next) {
    var domains = req.headers.host.split('.')

    if (domains.length !== subdomainCount && !req.user) {
      return next()
    }

    var tenantName = req.user ? req.user.name : domains[0]
    reporter.multitenancyRepository.findTenantByName(tenantName).then(function (tenant) {
      req.tenant = tenant
      return next()
    }).catch(function (e) {
      next()
    })
  })

  app.post('/reset', function (req, res, next) {
    logger.info(`rest password for ${req.body ? req.body.username : 'unknown'}`)

    reporter.multitenancyRepository.generateResetToken(req.body.username).then(function (token) {
      if (token) {
        passwordReset(reporter.mailer, req.body.username, token, req.protocol + '://' + req.get('host'))
      }

      req.session.viewModel = req.session.viewModel || {}
      req.session.viewModel.type = 'reset'
      req.session.viewModel.resetMessage = 'You can find the password reset link in your email'

      return res.redirect('/sign')
    }).catch(next)
  })

  app.use(function (req, res, next) {
    if (!req.tenant) {
      return next()
    }

    var publicRoute = _.find(reporter.authentication.publicRoutes, function (r) {
      return S(req.url).startsWith(r)
    })

    var pathname = url.parse(req.url).pathname

    req.isPublic = publicRoute || S(pathname).endsWith('.js') || S(pathname).endsWith('.css')
    next()
  })

  app.get('/sign', function (req, res, next) {
    var viewModel

    if (req.query.resetToken) {
      viewModel = _.extend({}, req.session.viewModel || {}, {
        resetToken: req.query.resetToken,
        type: 'performReset'
      })
      req.session.viewModel = null

      return res.render(path.join(__dirname, '../', 'public', 'login.ejs'), {
        viewModel: viewModel
      })
    }

    if (!req.user && !req.isPublic) {
      viewModel = _.extend({}, req.session.viewModel || {})
      req.session.viewModel = null

      res.render(path.join(__dirname, '../', 'public', 'login.ejs'), { viewModel: viewModel })
    } else {
      next()
    }
  })

  app.get('/gumroad', function (req, res) {
    reporter.multitenancyRepository.findTenantByName(req.user.name).then(function (tenant) {
      res.render(path.join(__dirname, '../', 'public', 'gumroad.html'), { viewModel: tenant })
    })
  })

// authenticate basic if request to API
  app.use(function (req, res, next) {
    if ((req.headers.authorization || (!req.isAuthenticated || !req.isAuthenticated())) &&
      (req.url.lastIndexOf('/api', 0) === 0 || req.url.lastIndexOf('/odata', 0) === 0)) {
      req.isBasicAuth = true
      passport.authenticate('basic', function (err, user, info) {
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

        req.logIn(user, function () {
          next()
        })
      })(req, res, next)
    } else {
      next()
    }
  })

  app.use(function (req, res, next) {
    res.set('Connection', 'close')

    var domains = req.headers.host.split('.')

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
        return res.redirect('http://' + domains.join('.') + '/sign')
      }
    }

    if (req.tenant && (subdomainCount === domains.length)) {
      return next()
    }

    if (req.tenant) {
      domains.unshift(req.tenant.name)
      return res.redirect('http://' + domains.join('.'))
    }

    res.clearCookie('session')
    req.session.destroy()
    req.logout()
    res.redirect('http://' + domains[domains.length - 2] + '.' + domains[domains.length - 1])
  })

  app.use(function (req, res, next) {
    if (req.tenant) {
      reporter.logger.info('Processing ' + req.method + ' ' + req.path + ' ' + req.tenant.username, { tenant: req.tenant.name })
    } else {
      reporter.logger.info('Processing anonymous' + req.method + ' ' + req.path)
    }

    next()
  })

  app.get('/api/message', function (req, res, next) {
    reporter.multitenancyRepository.findMessage().then((m) => {
      res.status(200).send(m)
    }).catch(next)
  })

  app.post('/api/password', function (req, res, next) {
    logger.debug(`change-password ${req.user.username}`)

    reporter.multitenancyRepository.changePassword(req.user, req.body.oldPassword, req.body.newPassword).then((m) => {
      return res.send(m)
    }).catch(next)
  })

  app.post('/api/register-contact-email', bodyParser.urlencoded({ extended: true, limit: '2mb' }), function (req, res, next) {
    logger.debug(`register-contact-email for tenant (${req.user.name}): ${req.body.contactEmail}`)

    reporter.multitenancyRepository.registerContactEmail(req.user, req.body.contactEmail).then((m) => {
      return res.send(m)
    }).catch(next)
  })

  app.get('/api/temporary-password/:name', function (req, res, next) {
    if (req.user.name !== reporter.options.admin) {
      return res.status(500).send('Forbiden')
    }

    reporter.multitenancyRepository.createTemporaryPassword(req.params.name).then((m) => {
      res.status(200).send(m)
    }).catch(next)
  })

  app.use(function (err, req, res, next) {
    if (_.isString(err)) {
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

    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl

    logger.warn('Error during processing request: ' + fullUrl + ' details: ' + err.message + ' ' + err.stack)

    if (req.get('Content-Type') !== 'application/json') {
      res.write('Error occured - ' + err.message + '\n')
      if (err.stack != null) {
        res.write('Stack - ' + err.stack)
      }
      res.end()
      return
    }

    res.json(err)
  })
}
