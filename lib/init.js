const scriptManager = require('./scriptsManager')
const electron = require('./electron')
const phantom = require('./phantom')
const wkhtmltopdf = require('./wkhtmltopdf')
const routes = require('./routes')
const path = require('path')
const Repository = require('./multitenancyRepository')
const logger = require('./logger')
const scheduling = require('./scheduling')
const billing = require('./billing')
const quota = require('./quota')
const fop = require('./fop')
const htmlToXlsx = require('./htmlToXlsx')
const blobs = require('./blobs')
const mailer = require('./mailer')
const errorNotifications = require('./errorNotifications')
const entityCountLimits = require('./entityCountLimits')

module.exports = () => {
  var jsreport = require('jsreport-core')({
    loadConfig: true,
    rootDirectory: path.join(__dirname, '../')
  }).afterConfigLoaded(() => {
    jsreport.options.tasks.scriptManager = scriptManager(jsreport)
    logger.init(jsreport)
  })

  // skip electron init in the main
  jsreport.__electron_html_to__ = () => { }

  jsreport.use(require('jsreport-authentication')())
  jsreport.use(require('jsreport-data')())
  jsreport.use(require('jsreport-templates')())
  jsreport.use(require('jsreport-fs-store')())
  jsreport.use(require('jsreport-express')())
  jsreport.use(require('jsreport-phantom-pdf')())
  jsreport.use(require('jsreport-electron-pdf')())
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
  jsreport.use(require('jsreport-ejs')())
  jsreport.use(require('jsreport-jade')())
  jsreport.use(require('jsreport-assets')())
  jsreport.use(require('jsreport-import-export')())
  jsreport.use(require('jsreport-tags')())

  jsreport.use(require('jsreport-mongodb-store')())

  jsreport.use({
    main: 'lib/multitenancy.js',
    directory: path.join(__dirname, '../'),
    name: 'multitenancy'
  })

  jsreport.multitenancyRepository = new Repository(jsreport)

  jsreport.on('before-express-configure', (app) => {
    routes(jsreport)
  })

  return jsreport.init().then(function () {
    jsreport.version = jsreport.options.stack
    jsreport.mailer = mailer(jsreport.options)
    blobs(jsreport)
    scheduling(jsreport)
    billing.init(jsreport)
    quota(jsreport)
    entityCountLimits(jsreport)
    errorNotifications.init(jsreport)

    jsreport.beforeRenderListeners.insert(0, 'loggly', function (request, response) {
      request.logger.rewriters.shift()

      request.logger.rewriters.push((level, msg, meta) => {
        jsreport.logger[level](msg, { requestId: request.id, tenant: request.tenant.name })
        return meta
      })
    })

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
    jsreport.extensionsManager.recipes.filter((r) => r.name === 'electron-pdf')[0].execute = electron(jsreport)
    jsreport.extensionsManager.recipes.push({ name: 'fop-pdf', execute: fop(jsreport) })
    jsreport.extensionsManager.recipes.push({ name: 'html-to-xlsx', execute: htmlToXlsx(jsreport) })

    return jsreport
  }).catch(function (e) {
    console.log(e.stack)
    throw e
  })
}
