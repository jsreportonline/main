const blobs = require('./blobs')
const mailer = require('./mailer')
const importExport = require('./importExport')
const scheduling = require('./scheduling')
const billing = require('./billing')
const creditLimitNotifications = require('./creditLimitNotifications')
const containerDataFilter = require('./containerDataFilter')
const credits = require('./credits')
const profiles = require('./profiles')
const reports = require('./reports')
const quota = require('./quota')
const entityCountLimits = require('./entityCountLimits')
const errorNotifications = require('./errorNotifications')

module.exports = (reporter, definition) => {
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

  profiles(reporter)
  reports(reporter, definition.options)

  const addTenant = (q, req) => {
    if (req) {
      q.tenantId = req.context.tenant.name
    }
  }

  reporter.documentStore.on('after-init', () => {
    // eslint-disable-next-line no-unused-vars
    for (const key in reporter.documentStore.collections) {
      const col = reporter.documentStore.collections[key]

      col.beforeFindListeners.add('multitenancy', (q, p, req) => addTenant(q, req))
      col.beforeInsertListeners.add('multitenancy', (doc, req) => addTenant(doc, req))
      col.beforeRemoveListeners.add('multitenancy', (q, req) => addTenant(q, req))
      col.beforeUpdateListeners.add('multitenancy', (q, u, o, req) => addTenant(q, req))
    }

    entityCountLimits(reporter)
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
