const blobs = require('./blobs')
const mailer = require('./mailer')
const importExport = require('./importExport')
const scheduling = require('./scheduling')
const billing = require('./billing')
const creditLimitNotifications = require('./creditLimitNotifications')
const containerDataFilter = require('./containerDataFilter')
const credits = require('./credits')
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

  reporter.version = reporter.options.stack
  reporter.mailer = mailer(reporter.options, reporter.logger)

  blobs(reporter)

  importExport(reporter)

  scheduling(reporter)

  errorNotifications(reporter)

  billing.init(reporter)
  credits(reporter)
  creditLimitNotifications(reporter)
  quota(reporter)

  containerDataFilter(reporter)

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
}