const quotaInterval = process.env.quotaInterval || 5 * 60 * 1000 // 5 minutes

const quota = {
  free: process.env.quotaFree || 50 * 1000,
  bronze: process.env.quotaBronze || 200 * 1000,
  silver: process.env.quotaSilver || 600 * 1000,
  gold: process.env.quotaGold || 1000 * 1000
}

module.exports = (reporter) => {
  reporter.initializeListeners.add('quota', () => {
    reporter.beforeRenderListeners.add('quota', (req, res) => {
      const tenant = req.context.tenant

      if (!tenant.quotaStart || (tenant.quotaStart.getTime() < (new Date().getTime() - quotaInterval))) {
        return reporter.multitenancyRepository.update({
          _id: tenant._id
        }, {
          $set: {
            quotaStart: new Date(),
            quotaUsed: 0
          }
        })
      }

      if (!validateQuota(tenant)) {
        req.context.throttled = true

        reporter.logger.warn('Request aborted because request quota exceeded', req)

        const err = reporter.createError(`Request quota exceeded, reset in: ${
          Math.ceil((tenant.quotaStart.getTime() + quotaInterval - new Date().getTime()) / 1000)
        }s`, {
          weak: true,
          statusCode: 429
        })

        err.stack = null

        throw err
      }
    })
  })
}

function validateQuota (tenant) {
  return tenant.quotaUsed == null || (tenant.quotaUsed < (tenant.quota || quota[tenant.plan] || quota.free))
}
