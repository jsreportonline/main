
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

    let lastError

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
            lastError = e
          }
        }

        const notFinishedProfiles = await reporter.documentStore.collection('profiles')
          .find({
            tenantId: t.name,
            $or: [{ state: 'running' }, { state: 'queued' }]
          })

        // eslint-disable-next-line no-unused-vars
        for (const profile of notFinishedProfiles) {
          if (reporter.closed || reporter.closing) {
            return
          }

          if (!profile.timeout) {
            continue
          }

          const whenShouldBeFinished = profile.timestamp + profile.timeout + reporter.options.reportTimeoutMargin * 2
          if (whenShouldBeFinished < new Date().getTime()) {
            continue
          }

          try {
            await reporter.documentStore.collection('profiles').update({
              _id: profile._id,
              tenantId: t.name
            }, {
              $set: {
                state: 'error',
                finishedOn: new Date(),
                error: 'The server did not update the report profile before its timeout. This can happen when the server is unexpectedly stopped.'
              }
            })
          } catch (e) {
            lastError = e
          }
        }
      }

      if (lastError) {
        reporter.logger.warn('(jo) Profile cleanup failed for some entities, last error:', lastError)
      }

      reporter.logger.debug('Cleaning old profiles done')
    } catch (e) {
      reporter.logger.warn('(jo) Profile cleanup failed', e)
    } finally {
      profilesCleanupRunning = false
    }
  }
}
