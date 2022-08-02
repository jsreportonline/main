const blobs = require('./blobs')
const mailer = require('../mailer')
const importExport = require('./importExport')
const scheduling = require('./scheduling')
const profiles = require('./profiles')
const reports = require('./reports')
const entityCountLimits = require('./entityCountLimits')
const errorNotifications = require('./errorNotifications')
const dockerWorker = require('./dockerWorker')
const creditsLimit = require('./creditsLimit')
const billing = require('./billing')
const quotaReject = require('./quotaReject.js')

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

  billing(reporter)
  quotaReject(reporter)
  creditsLimit(reporter)

  importExport(reporter)

  scheduling(reporter)

  const processDockerWorkerError = errorNotifications(reporter)

  dockerWorker(reporter, processDockerWorkerError)

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

  reporter.registerMainAction('jo.updateTenant', async (spec, originalReq) => {
    const localReq = reporter.Request(originalReq)

    const r = await reporter.multitenancyRepository.update({
      _id: localReq.context.tenant._id
    }, spec, localReq)
    return {
      nModified: r.nModified
    }
  })
}
