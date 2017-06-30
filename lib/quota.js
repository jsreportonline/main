const plans = require('./plans')

const quotaInterval = process.env.quotaInterval || 5 * 60 * 1000 // 5 minutes
const quota = {
  free: process.env.quotaFree || 50 * 1000,
  bronze: process.env.quotaBronze || 200 * 1000,
  silver: process.env.quotaSilver || 600 * 1000,
  gold: process.env.quotaGold || 1000 * 1000
}

const validateQuota = (tenant) => {
  const inQuota = tenant.quotaUsed < (tenant.quota || quota[tenant.plan] || quota['free'])
  const creditsUsed = Math.round(tenant.creditsUsed / 1000)
  let maxCreditsExcessAllowed = plans.maxCreditsExcessAllowed(tenant.plan)

  if (maxCreditsExcessAllowed == null) {
    maxCreditsExcessAllowed = plans.maxCreditsExcessAllowed('free')
  }

  const inAllowedExcessOfCredits = (creditsUsed <= tenant.creditsAvailable + (tenant.creditsAvailable * maxCreditsExcessAllowed))

  return {
    inQuota: inQuota,
    inAllowedExcessOfCredits: inAllowedExcessOfCredits,
    maxCreditsExcessAllowed: maxCreditsExcessAllowed
  }
}

module.exports = (reporter) => {
  reporter.beforeRenderListeners.insert({ after: 'debug' }, 'quota', (req, res) => {
    let validation

    if (!req.tenant.quotaStart || (req.tenant.quotaStart.getTime() < (new Date().getTime() - quotaInterval))) {
      return reporter.multitenancyRepository.update({
        _id: req.tenant._id
      }, {
        $set: {
          quotaStart: new Date(),
          quotaUsed: 0
        }
      })
    }

    validation = validateQuota(req.tenant)

    if (!validation.inAllowedExcessOfCredits) {
      req.logger.warn('Request aborted because maximum excess of credits allowed reached')
      const err = new Error(`Maximum excess of credits allowed for your plan (${validation.maxCreditsExcessAllowed * 100}%+) reached, please upgrade your plan or contact support. Credits used: ${Math.round(req.tenant.creditsUsed / 1000)}, Credits Available: ${req.tenant.creditsAvailable}`)
      err.stack = null
      err.weak = true
      err.status = 429
      throw err
    } else if (!validation.inQuota) {
      req.logger.warn('Request aborted because request quota exceeded')
      const err = new Error(`Request quota exceeded, reset in: ${Math.ceil((req.tenant.quotaStart.getTime() + quotaInterval - new Date().getTime()) / 1000)}s`)
      err.stack = null
      err.weak = true
      err.status = 429
      throw err
    }
  })

  const updateQuota = (req) => {
    return reporter.multitenancyRepository.update({
      _id: req.tenant._id
    }, {
      $inc: {
        quotaUsed: new Date().getTime() - req.startTime
      }
    })
  }

  reporter.renderErrorListeners.add('quota', updateQuota)
  reporter.afterRenderListeners.add('quota', updateQuota)
}
