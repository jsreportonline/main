
const pLimit = require('p-limit')
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
    let removedCounter = 0
    let updatedCounter = 0

    async function cleanTenant (t) {
      const profilesToRemove = await reporter.documentStore.collection('profiles')
        .find({ tenantId: t.name }, { _id: 1 })
        .sort({ timestamp: -1 })
        .skip(reporter.options.profiler.maxProfilesHistory)

      // eslint-disable-next-line no-unused-vars
      for (const profile of profilesToRemove) {
        if (reporter.closed || reporter.closing) {
          return
        }

        await reporter.documentStore.collection('profiles').remove({
          _id: profile._id,
          tenantId: t.name
        })
        removedCounter++
      }

      const notFinishedProfiles = await reporter.documentStore.collection('profiles')
        .find({
          tenantId: t.name,
          $or: [{ state: 'running' }, { state: 'queued' }]
        }, { _id: 1, timeout: 1, timestamp: 1 })

      // eslint-disable-next-line no-unused-vars
      for (const profile of notFinishedProfiles) {
        if (reporter.closed || reporter.closing) {
          return
        }

        if (!profile.timeout) {
          // this is redundant after we update core
          reporter.options.profiler.maxUnallocatedProfileAge = reporter.options.profiler.maxUnallocatedProfileAge || 24 * 60 * 60 * 1000
          if ((profile.timestamp.getTime() + reporter.options.profiler.maxUnallocatedProfileAge) < new Date().getTime()) {
            await reporter.documentStore.collection('profiles').update({
              _id: profile._id,
              tenantId: t.name
            }, {
              $set: {
                state: 'error',
                finishedOn: new Date(),
                error: 'The request wasn\'t parsed before timeout. This can happen when the server is unexpectedly stopped.'
              }
            })
            updatedCounter++
          }
          continue
        }

        const whenShouldBeFinished = profile.timestamp.getTime() + profile.timeout + reporter.options.reportTimeoutMargin * 2
        if (whenShouldBeFinished > new Date().getTime()) {
          continue
        }

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
        updatedCounter++
      }
    }

    try {
      const start = new Date()
      reporter.logger.info('Cleaning old profiles')

      const limit = pLimit(4)

      const tenants = await reporter.multitenancyRepository.find({
        lastLogin: { $gt: new Date(Date.now() - reporter.options.profiler.cleanupInterval * 2) }
      }, { _id: 1, name: 1 })

      await Promise.all(tenants.map((t) => limit(async () => {
        try {
          await cleanTenant(t)
        } catch (e) {
          lastError = e
        }
      })))

      if (lastError) {
        reporter.logger.warn('(jo) Profile cleanup failed for some entities, last error:', lastError)
      }

      reporter.logger.info(`Cleaning old profiles done (removed:${removedCounter}; updated:${updatedCounter}, time:${new Date().getTime() - start.getTime()}ms)`)
    } catch (e) {
      reporter.logger.warn('(jo) Profile cleanup failed', e)
    } finally {
      profilesCleanupRunning = false
    }
  }

  let profilesFullModeDurationCheckRunning = false
  reporter._profilesFullModeDurationCheck = async function () {
    if (!reporter._initialized) {
      return
    }

    if (profilesFullModeDurationCheckRunning) {
      return
    }

    profilesFullModeDurationCheckRunning = true

    let lastError
    let updatedCounter = 0

    try {
      const start = new Date()
      reporter.logger.info('Profile FullModeDurationCheck running')

      const limit = pLimit(4)

      const tenants = await reporter.multitenancyRepository.find({
        lastLogin: { $gt: new Date(Date.now() - reporter.options.profiler.fullModeDurationCheckInterval * 2) }
      }, { _id: 1, name: 1 })

      await Promise.all(tenants.map((t) => limit(async () => {
        try {
          const profiler = await reporter.documentStore.collection('settings').findOne({ key: 'profiler', tenantId: t.name })
          if (profiler == null || (profiler.modificationDate.getTime() + reporter.options.profiler.fullModeDuration) > new Date().getTime()) {
            return
          }

          const profilerValue = JSON.parse(profiler.value)

          if (profilerValue.mode !== 'full') {
            return
          }

          reporter.logger.info(`Switching full mode profiling back to standard to avoid performance degradation for tenant ${t.name}`)
          await reporter.documentStore.collection('settings').update({
            key: 'profiler',
            tenantId: t.name
          }, {
            $set: {
              value: JSON.stringify({
                mode: 'standard'
              })
            }
          })
          updatedCounter++
        } catch (e) {
          lastError = e
        }
      })))

      if (lastError) {
        reporter.logger.warn('Profile FullModeDurationCheck failed for some entities, last error:', lastError)
      }

      reporter.logger.info(`Profile FullModeDurationCheck done (updated:${updatedCounter}; time:${new Date().getTime() - start.getTime()}ms)`)
    } catch (e) {
      reporter.logger.warn('Profile FullModeDurationCheck failed', e)
    } finally {
      profilesFullModeDurationCheckRunning = false
    }
  }
}
