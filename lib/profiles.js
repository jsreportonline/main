
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
      reporter.logger.info('Cleaning old profiles')
      const tenants = await reporter.multitenancyRepository.find({})

      // eslint-disable-next-line no-unused-vars
      for (const t of tenants) {
        const profiles = await reporter.documentStore.collection('profiles').find({ tenantId: t.name }, { _id: 1 }).sort({ timestamp: -1 })
        const profilesToRemove = profiles.slice(reporter.options.profiler.maxProfilesHistory)

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

      reporter.logger.info('Cleaning old profiles done')
    } catch (e) {
      reporter.logger.warn('(jo) Profile cleanup failed', e)
    } finally {
      profilesCleanupRunning = false
    }
  }
}
