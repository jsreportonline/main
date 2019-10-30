const parseDuration = require('parse-duration')
const Promise = require('bluebird')

module.exports = (reporter, { reportsCleanupInterval = '1h' }) => {
  const intervalMS = parseDuration(reportsCleanupInterval)

  const tenantTreshold = (t) => {
    if (t.reportsCleanupTreshold) {
      return parseDuration(t.reportsCleanupTreshold)
    }

    switch (t.plan || 'free') {
      case 'free': return 1000 * 60 * 60 * 24 // day
      case 'bronze': return 1000 * 60 * 60 * 24 * 7 // week
      case 'silver': return 1000 * 60 * 60 * 24 * 31 // month
      case 'gold': return 1000 * 60 * 60 * 24 * 31 // month
    }
  }

  const interval = setInterval(async () => {
    try {
      reporter.logger.info(`Cleaning old reports`)
      const tenants = await reporter.multitenancyRepository.find({})

      for (const t of tenants) {
        try {
          const removeOlderDate = new Date(Date.now() - tenantTreshold(t))
          const reportsToRemove = await reporter.documentStore.collection('reports').find({ creationDate: { $lt: removeOlderDate }, tenantId: t.name }, { _id: 1 }).sort({ creationDate: 1 })

          if (reportsToRemove.length > 0) {
            reporter.logger.info(`Removing ${reportsToRemove.length} for tenant ${t.name}`)
          }

          await Promise.map(
            reportsToRemove,
            (r) => reporter.documentStore.collection('reports').remove({ _id: r._id }),
            { concurrency: 5 })
        } catch (e) {
          reporter.logger.error(`Reports cleanup failed ${e.stack}`)
        }
      }

      reporter.logger.info(`Cleaning old reports done`)
    } catch (e) {
      reporter.logger.error(`Finding tenants for reports cleanup failed ${e.stack}`)
    }
  }, intervalMS)

  reporter.closeListeners.insert(0, 'reports', () => clearInterval(interval))
}
