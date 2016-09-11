const winston = require('winston')
const ScriptManager = require('./scriptsManager')
const phantom = require('./phantom')
const wkhtmltopdf = require('./wkhtmltopdf')
const routes = require('./routes')
const path = require('path')
const Repository = require('./multitenancyRepository')
const logger = require('./logger')
const scheduling = require('./scheduling')
const billing = require('./billing')
const fop = require('./fop')

module.exports = () => {
  var jsreport = require('jsreport-core')({
    loadConfig: true,
    rootDirectory: path.join(__dirname, '../')
  }).afterConfigLoaded(() => {
    jsreport.options.tasks.scriptManager = new ScriptManager(jsreport.options.tasks)
  })

  jsreport.use(require('jsreport-authentication')())
  jsreport.use(require('jsreport-data')())
  jsreport.use(require('jsreport-templates')())
  jsreport.use(require('jsreport-fs-store')())
  jsreport.use(require('jsreport-express')())
  jsreport.use(require('jsreport-phantom-pdf')())
  jsreport.use(require('jsreport-studio')())
  jsreport.use(require('jsreport-handlebars')())
  jsreport.use(require('jsreport-debug')())
  jsreport.use(require('jsreport-scripts')())
  jsreport.use(require('jsreport-authorization')())
  jsreport.use(require('jsreport-jsrender')())
  jsreport.use(require('jsreport-child-templates')())
  jsreport.use(require('jsreport-browser-client')())
  jsreport.use(require('jsreport-public-templates')())
  jsreport.use(require('jsreport-images')())
  jsreport.use(require('jsreport-scheduling')())
  jsreport.use(require('jsreport-reports')())
  jsreport.use(require('jsreport-resources')())
  jsreport.use(require('jsreport-text')())
  jsreport.use(require('jsreport-xlsx')())
  jsreport.use(require('jsreport-wkhtmltopdf')())
  jsreport.use(require('jsreport-html-to-xlsx')())

  jsreport.use({
    main: 'lib/multitenancy.js',
    directory: path.join(__dirname, '../'),
    name: 'multitenancy'
  })
  jsreport.use(require('../mongo/mongo')())

  if (!jsreport.logger.transports.main) {
    jsreport.logger.add(winston.transports.File, {
      name: 'main',
      filename: 'reporter.log',
      maxsize: 10485760,
      json: false,
      level: 'debug'
    })

    jsreport.logger.add(winston.transports.Console, {
      level: 'debug'
    })
  }

  logger.set(jsreport.logger)

  jsreport.multitenancyRepository = new Repository(jsreport)

  jsreport.on('before-express-configure', (app) => {
    routes(jsreport)
  })

  return jsreport.init().then(function () {
    scheduling(jsreport)
    billing.init(jsreport)

    const addTenant = (q, req) => {
      if (req) {
        q.tenantId = req.tenant.name
      }
    }

    for (var key in jsreport.documentStore.collections) {
      var col = jsreport.documentStore.collections[key]

      col.beforeFindListeners.add('multitenancy', (q, req) => addTenant(q, req))
      col.beforeInsertListeners.add('multitenancy', (q, req) => addTenant(q, req))
      col.beforeRemoveListeners.add('multitenancy', (q, req) => addTenant(q, req))
      col.beforeUpdateListeners.add('multitenancy', (q, u, req) => addTenant(q, req))
    }

    jsreport['phantom-pdf'].conversion = phantom(jsreport)
    jsreport['wkhtmltopdf'].conversion = wkhtmltopdf(jsreport)
    jsreport.extensionsManager.recipes.push({ name: 'fop-pdf', execute: fop(jsreport) })

    console.log(jsreport.extensionsManager.recipes)
    return jsreport
  }).catch(function (e) {
    console.log(e.stack)
    throw e
  })
}

