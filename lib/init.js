const path = require('path')
const routes = require('./routes')
const Repository = require('./multitenancyRepository')
const logger = require('./logger')
const importExport = require('./importExport')
const scheduling = require('./scheduling')
const billing = require('./billing')
const creditLimitNotifications = require('./creditLimitNotifications')
const credits = require('./credits')
const quota = require('./quota')
const blobs = require('./blobs')
const windowsWorkers = require('./windowsWorkers')
const mailer = require('./mailer')
const errorNotifications = require('./errorNotifications')
const entityCountLimits = require('./entityCountLimits')

module.exports = async () => {
  const jsreport = require('jsreport-core')({
    loadConfig: true,
    rootDirectory: path.join(__dirname, '../')
  }).afterConfigLoaded(() => {
    logger.init(jsreport)
  })

  // skip electron init in the main
  jsreport.__electron_html_to__ = () => { }

  jsreport.use(require('jsreport-authentication')())
  jsreport.use(require('jsreport-data')())
  jsreport.use(require('jsreport-templates')())
  jsreport.use(require('jsreport-express')())
  jsreport.use(require('jsreport-chrome-pdf')())
  jsreport.use(require('jsreport-phantom-pdf')())
  jsreport.use(require('jsreport-electron-pdf')())
  jsreport.use(require('jsreport-html-to-xlsx')())
  jsreport.use(require('jsreport-pdf-utils')())
  jsreport.use(require('jsreport-studio')())
  jsreport.use(require('jsreport-handlebars')())
  jsreport.use(require('jsreport-debug')({
    // can't pass this through config file because of debug env already set
    maxLogResponseHeaderSize: 3000
  }))
  jsreport.use(require('jsreport-scripts')())
  jsreport.use(require('jsreport-authorization')())
  jsreport.use(require('jsreport-jsrender')())
  jsreport.use(require('jsreport-child-templates')())
  jsreport.use(require('jsreport-browser-client')())
  jsreport.use(require('jsreport-public-templates')())
  // jsreport.use(require('jsreport-images')())
  jsreport.use(require('jsreport-scheduling')({ autoStart: false }))
  jsreport.use(require('jsreport-reports')())
  jsreport.use(require('jsreport-resources')())
  jsreport.use(require('jsreport-text')())
  jsreport.use(require('jsreport-xlsx')())
  jsreport.use(require('jsreport-fop-pdf')())
  jsreport.use(require('jsreport-wkhtmltopdf')())
  jsreport.use(require('jsreport-ejs')())
  jsreport.use(require('jsreport-pug')())
  jsreport.use(require('jsreport-assets')())
  jsreport.use(require('jsreport-version-control')())
  jsreport.use(require('jsreport-import-export')())
  jsreport.use(require('jsreport-tags')())

  jsreport.use(require('jsreport-mongodb-store')())

  jsreport.use(require('jsreport-worker-docker-manager')({ discriminatorPath: 'context.tenant.name' })) // DONE

  jsreport.use({
    main: 'lib/multitenancy.js',
    directory: path.join(__dirname, '../'),
    name: 'multitenancy'
  })

  jsreport.multitenancyRepository = new Repository(jsreport)

  jsreport.on('before-express-configure', (app) => {
    routes(jsreport)
  })

  // adding our rewriters first (before extensions) to ensure that we have original req.context
  // as meta
  jsreport.logger.rewriters.splice(0, 0, (level, msg, meta) => {
    // detecting if meta is jsreport request object
    if (meta != null && meta.context) {
      return Object.assign({}, meta, {
        requestId: meta.context.id,
        tenant: meta.context.tenant.name
      })
    }

    return meta
  })

  jsreport.logger.rewriters.splice(1, 0, (level, msg, meta) => {
    if (meta != null) {
      return Object.assign({}, meta, {
        stack: jsreport.options.stack,
        ip: jsreport.options.ip
      })
    }

    return meta
  })

  await jsreport.init()

  // adding custom recipe for phantomjs execution in windows
  jsreport['phantom-pdf'].definition.options.phantoms.push({
    version: '1.9.8-windows',
    path: 'phantomjs'
  })

  // adding custom recipe for wkhtmltopdf execution in windows
  jsreport.wkhtmltopdf.definition.options.wkhtmltopdfVersions.push({
    version: '0.12.3-windows',
    path: 'wkhtmltopdf'
  })

  console.log('dbs configured:', jsreport.options.db)

  if (process.env.createIndexes) {
    await require('./indexes').ensureIndexes(jsreport.documentStore.provider.db, jsreport.multitenancyRepository.db)
  }

  jsreport.version = jsreport.options.stack
  jsreport.mailer = mailer(jsreport.options, jsreport.logger)
  blobs(jsreport)
  billing.init(jsreport)
  creditLimitNotifications(jsreport)
  credits(jsreport)
  quota(jsreport)
  entityCountLimits(jsreport)

  const cleanWindowsWorkersPing = windowsWorkers(jsreport)

  jsreport.closeListeners.add('jo', cleanWindowsWorkersPing)

  errorNotifications.init(jsreport)

  const addTenant = (q, req) => {
    if (req) {
      q.tenantId = req.context.tenant.name
    }
  }

  for (let key in jsreport.documentStore.collections) {
    let col = jsreport.documentStore.collections[key]

    col.beforeFindListeners.add('multitenancy', (q, p, req) => addTenant(q, req))
    col.beforeInsertListeners.add('multitenancy', (doc, req) => addTenant(doc, req))
    col.beforeRemoveListeners.add('multitenancy', (q, req) => addTenant(q, req))
    col.beforeUpdateListeners.add('multitenancy', (q, u, o, req) => addTenant(q, req))
  }

  importExport(jsreport)
  scheduling(jsreport)

  return jsreport
}
