
module.exports = (reporter) => {
  let profilesCleanupRunning = false

  reporter._profilesCleanup = async function joProfilesCleanup () {
    // don't run for startup
    if (!reporter._initialized) {
      return
    }

    if (profilesCleanupRunning) {
      return
    }

    profilesCleanupRunning = true

    let lastRemoveError

    try {
      reporter.logger.debug('Cleaning old profiles')

      const tenants = await reporter.multitenancyRepository.find({
        lastLogin: { $gt: new Date(Date.now() - reporter.options.profiler.cleanupInterval * 2) }
      })

      // eslint-disable-next-line no-unused-vars
      for (const t of tenants) {
        const profilesToRemove = await reporter.documentStore.collection('profiles')
          .find({ tenantId: t.name }, { _id: 1 })
          .sort({ timestamp: -1 })
          .skip(reporter.options.profiler.maxProfilesHistory)

        // eslint-disable-next-line no-unused-vars
        for (const profile of profilesToRemove) {
          if (reporter.closed || reporter.closing) {
            return
          }

          try {
            await reporter.documentStore.collection('profiles').remove({
              _id: profile._id,
              tenantId: t.name
            })
          } catch (e) {
            lastRemoveError = e
          }
        }
      }

      if (lastRemoveError) {
        reporter.logger.warn('(jo) Profile cleanup failed for some entities, last error:', lastRemoveError)
      }

      reporter.logger.debug('Cleaning old profiles done')
    } catch (e) {
      reporter.logger.warn('(jo) Profile cleanup failed', e)
    } finally {
      profilesCleanupRunning = false
    }
  }
}
