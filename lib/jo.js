const blobs = require('./blobs')
const mailer = require('./mailer')
const studioLogs = require('./studioLogs')
const importExport = require('./importExport')
const scheduling = require('./scheduling')
const billing = require('./billing')
const creditLimitNotifications = require('./creditLimitNotifications')
const containerDataFilter = require('./containerDataFilter')
const credits = require('./credits')
const reports = require('./reports')
const quota = require('./quota')
const entityCountLimits = require('./entityCountLimits')
const windowsWorkers = require('./windowsWorkers')
const errorNotifications = require('./errorNotifications')

module.exports = (reporter, definition) => {
  // adding custom recipe for phantomjs execution in windows
  reporter['phantom-pdf'].definition.options.phantoms.push({
    version: '1.9.8-windows',
    path: 'phantomjs'
  })

  // adding custom recipe for wkhtmltopdf execution in windows
  reporter.wkhtmltopdf.definition.options.wkhtmltopdfVersions.push({
    version: '0.12.3-windows',
    path: 'wkhtmltopdf'
  })

  reporter.mailer = mailer(reporter.options, reporter.logger)

  // customize duplication detection logic, this allows to properly identify duplicates during
  // import-export
  reporter.documentStore.checkDuplicatedId = async (collectionName, idValue, req) => {
    const results = await reporter.documentStore.collection(collectionName).find({
      _id: idValue
    })

    if (results.length === 0) {
      return
    }

    return results[0]
  }

  if (definition.options.standardBlobStorage !== true) {
    blobs(reporter)
  }

  studioLogs(reporter, definition.options.discriminatorPath)

  importExport(reporter)

  scheduling(reporter)

  errorNotifications(reporter)

  // specify the right order of beforeRender/afterRender is a bit tricky
  // for the jo logic this should be the right order
  // (if we need to update the order of the calls bellow or add more listeners we should verify this order again)
  //
  // beforeRenderListeners:
  //   - billing
  //   - creditsLimitNotification
  //   - credits
  //   - quota
  //
  // afterRenderListeners:
  //   - billing
  //   - quota
  billing.init(reporter)
  creditLimitNotifications(reporter)
  credits(reporter)
  quota(reporter)

  containerDataFilter(reporter)
  reports(reporter, definition.options)

  const cleanWindowsWorkersPing = windowsWorkers(reporter)

  reporter.closeListeners.add('jo', cleanWindowsWorkersPing)

  const addTenant = (q, req) => {
    if (req) {
      q.tenantId = req.context.tenant.name
    }
  }

  reporter.documentStore.on('after-init', () => {
    for (let key in reporter.documentStore.collections) {
      let col = reporter.documentStore.collections[key]

      col.beforeFindListeners.add('multitenancy', (q, p, req) => addTenant(q, req))
      col.beforeInsertListeners.add('multitenancy', (doc, req) => addTenant(doc, req))
      col.beforeRemoveListeners.add('multitenancy', (q, req) => addTenant(q, req))
      col.beforeUpdateListeners.add('multitenancy', (q, u, o, req) => addTenant(q, req))
    }

    entityCountLimits(reporter)
  })

  reporter.beforeRenderListeners.insert({ before: 'scripts' }, 'back-compatibility-before-script-run', (req, res) => {
    if (req.context.isChildRequest != null) {
      req.options = req.options || {}
      req.options.isChildRequest = req.context.isChildRequest
    }
  })

  reporter.beforeRenderListeners.insert({ after: 'scripts' }, 'back-compatibility-after-script-run', (req, res) => {
    if (req.template && req.template.engine === 'jade') {
      req.template.engine = 'pug'
    }

    if (Array.isArray(req.data)) {
      reporter.logger.info(`Detected deprecated usage of input data as array. template name: ${
        req.template.name
      }, shortid: ${req.template.shortid}, tenant: ${req.context.tenant.name}, requestId: ${req.context.id}`, {
        requestId: req.context.id,
        tenant: req.context.tenant.name,
        deprecation: true
      })
    }
  })

  reporter.initializeListeners.add(definition.name, () => {
    if (reporter.express) {
      reporter.express.exposeOptionsToApi(definition.name, {
        version: definition.options.version,
        jsreportVersion: definition.options.jsreportVersion
      })
    }
  })
}
